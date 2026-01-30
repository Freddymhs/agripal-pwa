# FASE 7: Optimizaciones Avanzadas + Cleanup

## Objetivo
Optimizaciones finales de performance, cleanup de código SVG obsoleto, y hardening para producción.

## Prerequisitos
- FASE 6 completada (integración funcional verificada)

---

## 1. Viewport Culling (Plantas fuera de vista)

Cuando el usuario está zoomeado (scale > 2x), la mayoría de las plantas están fuera del viewport. No tiene sentido enviar esas partículas a la GPU.

**Implementación:**
```typescript
// En pixi-plantas-layer.ts

updateVisibility(viewportBounds: { minX, minY, maxX, maxY }): void {
  const particles = this.container.particleChildren

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i]
    const inView = (
      p.x + p.width/2 >= viewportBounds.minX &&
      p.x - p.width/2 <= viewportBounds.maxX &&
      p.y + p.height/2 >= viewportBounds.minY &&
      p.y - p.height/2 <= viewportBounds.maxY
    )
    p.alpha = inView ? 1 : 0  // alpha 0 = GPU skip
  }
}

// Llamar en cada frame de pan/zoom (throttled)
```

**Impacto:**
- A zoom 5x: ~80% de plantas son alpha 0 → GPU procesa solo 20%
- A zoom 10x: ~95% de plantas son alpha 0 → GPU procesa solo 5%
- A zoom 1x (todo visible): sin beneficio (todas alpha 1)

**Nota:** ParticleContainer podría aún enviar todas las partículas al GPU incluso con alpha 0, pero el fragment shader las descarta rápido. Para culling real, se necesitaría mantener 2 pools (visible/invisible). Evaluar si el overhead de mover partículas entre pools justifica el beneficio.

---

## 2. Level of Detail (LOD)

A zoom muy lejano (< 0.5x), renderizar 66k círculos detallados es innecesario. Se pueden simplificar.

**Niveles:**
```
Zoom > 2x:   Textura con detalle (borde visible, X clara)
Zoom 0.5-2x: Textura normal (actual)
Zoom < 0.5x: Punto de 1px (sin textura, solo color)
```

**Implementación:**
```typescript
// En pixi-plantas-layer.ts

updateLOD(scale: number): void {
  if (scale < 0.5) {
    // Usar textura mínima (2x2 px)
    const particles = this.container.particleChildren
    for (const p of particles) {
      p.texture = this.textureFactory.getTexture('minimal')
      p.scaleX = 1 / scale * 0.5
      p.scaleY = 1 / scale * 0.5
    }
  } else {
    // Usar textura normal
    // (rebuild solo si cambió de LOD)
  }
}
```

---

## 3. Incremental Updates (Evitar Rebuild Completo)

Actualmente, cualquier cambio en `plantas[]` causa un rebuild completo del ParticleContainer. Para operaciones frecuentes (agregar 1 planta, cambiar estado), un update incremental es más eficiente.

**Implementación:**
```typescript
// En pixi-plantas-layer.ts

addPlanta(planta: Planta, zona: Zona, cultivoEspaciado: number, scale: number): void {
  const particle = this.createParticle(planta, zona, cultivoEspaciado, scale, false)
  this.container.addParticle(particle)
  this.plantaIndexMap.set(planta.id, this.container.particleChildren.length - 1)
}

removePlanta(plantaId: string): void {
  const index = this.plantaIndexMap.get(plantaId)
  if (index === undefined) return
  this.container.removeParticleAt(index)
  this.plantaIndexMap.delete(plantaId)
  // Reindexar (necesario porque los índices cambian)
  this.reindex()
}

updateEstado(plantaId: string, nuevoEstado: string): void {
  const index = this.plantaIndexMap.get(plantaId)
  if (index === undefined) return
  const particle = this.container.particleChildren[index]
  particle.tint = COLORES_ESTADO_PLANTA_HEX[nuevoEstado]
  // Textura cambia si muerta
  if (nuevoEstado === 'muerta') {
    particle.texture = this.textureFactory.getTexture('muerta', false)
  }
}
```

**Cuándo usar rebuild vs incremental:**
```
Rebuild completo:
  - Cambio de terreno (todas las plantas cambian)
  - Grid automático (66k plantas nuevas)
  - Eliminar zona con plantas

Update incremental:
  - Agregar 1 planta
  - Eliminar 1 planta
  - Cambiar estado de 1 planta
  - Cambiar estado de lote (< 1000 plantas)
```

---

## 4. WebGL Fallback y Detección

```typescript
// En use-pixi-app.ts

function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl')
    )
  } catch {
    return false
  }
}

// En el componente:
if (!checkWebGLSupport()) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-yellow-50 p-8">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-yellow-800">WebGL no disponible</h3>
        <p className="text-sm text-yellow-600 mt-2">
          Tu navegador no soporta WebGL. Algunas funciones del mapa pueden estar limitadas.
        </p>
      </div>
    </div>
  )
}
```

**Nota:** En 2026, ~99% de navegadores soportan WebGL2. El fallback es defensivo.

---

## 5. Destrucción Limpia y Memory Leaks

```typescript
// Checklist de destrucción en pixi-mapa-terreno-inner.tsx

useEffect(() => {
  return () => {
    // 1. Layers
    gridLayerRef.current?.destroy()
    zonasLayerRef.current?.destroy()
    plantasLayerRef.current?.destroy()
    overlayLayerRef.current?.destroy()

    // 2. Texturas
    textureFactoryRef.current?.destroy()

    // 3. Hit test
    hitTestRef.current?.destroy()

    // 4. Application (destruye renderer, stage, canvas)
    appRef.current?.destroy(true, { children: true })

    // 5. Observers
    resizeObserverRef.current?.disconnect()
  }
}, [])
```

**Verificación con DevTools:**
1. Heap Snapshot antes de montar el mapa
2. Usar la app normalmente (plantar 66k, pan/zoom, seleccionar)
3. Navegar fuera del mapa
4. Heap Snapshot después
5. Comparar: no debe haber objetos PixiJS retenidos

---

## 6. Touch Events (Mobile PWA)

PixiJS v8 maneja touch events nativamente via `FederatedPointerEvents`. Sin embargo, necesitamos verificar:

```
- Pinch to zoom: PixiJS stage no lo maneja por defecto
- Pan con un dedo: Funciona via pointerdown/move/up
- Tap para seleccionar: Funciona via pointertap
- Long press: Para contexto menú
```

**Pinch to zoom (implementación manual):**
```typescript
let lastTouchDist = 0

app.stage.on('touchmove', (e) => {
  if (e.touches?.length === 2) {
    const [t1, t2] = e.touches
    const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)

    if (lastTouchDist > 0) {
      const delta = dist - lastTouchDist
      const newScale = clamp(currentScale + delta * 0.01, MIN_SCALE, MAX_SCALE)
      worldContainer.scale.set(newScale)
    }
    lastTouchDist = dist
  }
})

app.stage.on('touchend', () => { lastTouchDist = 0 })
```

---

## 7. Cleanup de Archivos SVG Obsoletos

**Eliminar:**
```
src/components/mapa/planta-marker.tsx    → Reemplazado por pixi-plantas-layer.ts
src/components/mapa/zona-rect.tsx        → Reemplazado por pixi-zonas-layer.ts
src/components/mapa/mapa-grid.tsx        → Reemplazado por pixi-grid-layer.ts
src/components/mapa/mapa-terreno.tsx     → Reemplazado por pixi-mapa-terreno.tsx
src/hooks/useMapControls.ts             → Reemplazado por use-pixi-viewport.ts
```

**Mantener:**
```
src/components/mapa/mapa-controls.tsx    → HTML overlay (sin cambios)
src/components/mapa/editor-zona.tsx      → Form UI (sin cambios)
src/components/mapa/nueva-zona-modal.tsx → Modal UI (sin cambios)
```

**Verificar que nada más importa los archivos eliminados:**
```bash
grep -r "planta-marker\|zona-rect\|mapa-grid\|mapa-terreno\|useMapControls" src/ --include="*.ts" --include="*.tsx"
```

---

## 8. Performance Budget Final

| Métrica | Target | Cómo medir |
|---------|--------|-----------|
| FPS (pan/zoom 66k) | >= 55 FPS | Chrome DevTools Performance |
| Frame time | < 18ms (P95) | Performance Monitor |
| Memory (rendering) | < 20 MB | DevTools Memory |
| Initial load | < 500ms | Performance.now() |
| Rebuild 66k | < 100ms | Console.time |
| Hit test | < 0.5ms | Console.time |
| Bundle size delta | < 250KB gzipped | `pnpm build`, compare |

---

## Testing Final de Fase 7

| Test | Esperado |
|------|----------|
| Viewport culling a zoom 5x | Solo ~20% plantas procesadas |
| LOD a zoom 0.3x | Puntos mínimos, no texturas detalladas |
| Agregar 1 planta | Aparece sin rebuild completo (< 1ms) |
| Eliminar 1 planta | Desaparece sin rebuild completo |
| WebGL detection | Mensaje amigable si no soportado |
| Memory leak test | Sin objetos PixiJS retenidos post-destroy |
| Touch pan (mobile) | Pan suave con un dedo |
| Pinch zoom (mobile) | Zoom suave con dos dedos |
| Build limpio | `pnpm build` sin errores ni warnings |
| Archivos eliminados | No quedan imports rotos |

## Resultado Final
Aplicación optimizada con PixiJS v8, 60 FPS con 66k+ plantas, sin memory leaks, compatible mobile, y código SVG antiguo eliminado.
