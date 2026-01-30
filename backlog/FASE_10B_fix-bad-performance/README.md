# Fix Bad Performance: SVG → PixiJS v8 (WebGL)

## Problema
66,600 plantas renderizadas como SVG = 266,400 DOM nodes = 1-5 FPS

## Solución
PixiJS v8 ParticleContainer (WebGL) = 1 draw call = 60 FPS

## Dependencias
```bash
pnpm add pixi.js@^8 rbush @types/rbush
```

## Fases

| Fase | Descripción | Archivos nuevos |
|------|------------|----------------|
| [FASE 1](./FASE_1_FUNDACION.md) | Canvas WebGL + pan/zoom | 5 |
| [FASE 2](./FASE_2_GRID_ZONAS.md) | Grid visual + zonas interactivas | 2 |
| [FASE 3](./FASE_3_PLANTAS_PARTICLECONTAINER.md) | 66k plantas a 60 FPS | 2 |
| [FASE 4](./FASE_4_HIT_TESTING.md) | Click, hover, selección con RBush | 1 |
| [FASE 5](./FASE_5_OVERLAYS.md) | Selección rect, snap guides, previews | 1 |
| [FASE 6](./FASE_6_INTEGRACION.md) | Conectar con page.tsx, testing completo | 0 |
| [FASE 7](./FASE_7_OPTIMIZACIONES_CLEANUP.md) | Culling, LOD, cleanup SVG | 0 |

## Dependencia entre Fases
```
FASE 1 → FASE 2 → FASE 3 → FASE 4 → FASE 5 → FASE 6 → FASE 7
```

## Archivos Nuevos (total: 11)
```
src/components/mapa/pixi/
├── pixi-constants.ts           (Fase 1)
├── use-pixi-app.ts             (Fase 1)
├── use-pixi-viewport.ts        (Fase 1)
├── pixi-mapa-terreno-inner.tsx  (Fase 1, crece en cada fase)
├── pixi-mapa-terreno.tsx        (Fase 1)
├── pixi-grid-layer.ts          (Fase 2)
├── pixi-zonas-layer.ts         (Fase 2)
├── pixi-texture-factory.ts     (Fase 3)
├── pixi-plantas-layer.ts       (Fase 3)
├── pixi-hit-test.ts            (Fase 4)
└── pixi-overlay-layer.ts       (Fase 5)
```

## Archivos Eliminados (Fase 7)
```
src/components/mapa/planta-marker.tsx
src/components/mapa/zona-rect.tsx
src/components/mapa/mapa-grid.tsx
src/components/mapa/mapa-terreno.tsx
src/hooks/useMapControls.ts
```

## Archivos Sin Cambios
```
src/hooks/usePlantas.ts
src/hooks/usePlantasLote.ts
src/lib/validations/planta.ts
src/lib/utils/coordinates.ts
src/types/index.ts
src/components/mapa/mapa-controls.tsx
src/components/mapa/editor-zona.tsx
src/components/mapa/nueva-zona-modal.tsx
src/components/plantas/*
```

## Performance Esperada

| Métrica | SVG (actual) | PixiJS (nuevo) |
|---------|-------------|----------------|
| FPS (66k pan) | 1-5 | 60 |
| DOM nodes | 266,400 | 1 (canvas) |
| Memory | ~89 MB | ~15 MB |
| Draw calls | 266,400 | ~13 |
| Rebuild 66k | N/A | < 100ms |
| Hit test | O(n) | O(log n) < 0.5ms |

## Fixes Post-Implementacion

### Fix 1: Pan/zoom no funcionaba con el mouse
**Problema**: El desplazamiento con mouse no funcionaba despues de la migracion.
**Causa raiz**:
1. `usePixiViewport` recibia `worldRef.current` (null al momento del call) en vez del ref object. Al ser un ref, los cambios no disparan re-renders, asi que el useEffect del hook nunca registro handlers.
2. Dos sistemas de eventos compitiendo: el viewport auto-registraba pointer events en canvas Y el componente inner registraba los suyos propios. Conflicto.

**Solucion**:
- Cambiar la firma del viewport para aceptar `RefObject<Container | null>` y leer `.current` dentro de los handlers.
- Quitar el auto-registro de pointer events del viewport. Pan expuesto como metodos imperativos `startPan()/movePan()/endPan()` llamados por el componente inner como fallback.

**Archivos modificados**: `use-pixi-viewport.ts`, `pixi-mapa-terreno-inner.tsx`

### Fix 2: No se podia hacer zoom-out suficiente en terrenos grandes
**Problema**: Un terreno de 1000x600m (10,000x6,000px) a escala 0.3x = 3,000x1,800px, mas grande que la mayoria de pantallas. No se podia ver todo el area.
**Causa raiz**: `MIN_SCALE = 0.3` era constante hardcodeada. Tambien habia `Math.max(0.3, ...)` hardcodeado en el handler de zoom-out.

**Solucion**:
- `MIN_SCALE` bajado a `0.01` como piso minimo.
- Nuevo metodo `fitView(worldWidthPx, worldHeightPx)` en `use-pixi-viewport.ts` que calcula la escala necesaria para que el terreno quepa en el canvas con padding.
- `fitView` se ejecuta automaticamente al montar el componente (vista inicial ajustada al terreno).
- Boton reset (1:1) ahora usa `fitView` para ajustar la vista al terreno completo.
- Hardcoded `Math.max(0.3, ...)` cambiado a `Math.max(0.01, ...)`.

**Archivos modificados**: `pixi-constants.ts`, `use-pixi-viewport.ts`, `pixi-mapa-terreno-inner.tsx`

### Fix 3: Crash "Cannot read properties of null (reading 'removeChild')"
**Problema**: Al asignar una zona grande (ej. todo el terreno), crash con `TypeError: Cannot read properties of null (reading 'removeChild')` en linea 107 de `pixi-mapa-terreno-inner.tsx`.
**Causa raiz**: El cleanup del useEffect que crea el world Container usaba `app.stage.removeChild(world)` sin optional chaining. Cuando React re-renderiza y los cleanups corren, si el app ya fue destruido primero, `app.stage` es null.
**Solucion**: Cambiar `app.stage.removeChild(world)` a `app.stage?.removeChild(world)`.
**Archivos modificados**: `pixi-mapa-terreno-inner.tsx`

### Fix 4: Flickering/loop al borrar muchas plantas (Cargando... ↔ mapa)
**Problema**: Al seleccionar y borrar miles de plantas, la pantalla alternaba entre "Cargando..." y el mapa renderizado en loop, desmontando y remontando el componente PixiJS completo.
**Causa raiz**: `cargarDatosTerreno()` siempre ejecutaba `setLoading(true)`, incluyendo refetches post-eliminacion. Linea 534 en page.tsx: `if (loading || !terrenoActual)` desmonta todo el mapa y muestra el spinner. Al terminar el refetch, el mapa se remontaba desde cero (nueva app PixiJS, texturas, layers).
**Solucion**: Solo mostrar loading en la carga inicial. Refetches posteriores actualizan datos sin desmontar el mapa. Se usa `initialLoadDone` ref que se resetea al cambiar de terreno.
**Archivos modificados**: `src/app/page.tsx`

### Fix 5: Arrastrar en modo "plantar" plantaba sin querer
**Problema**: En modo "plantar", al hacer click y arrastrar para desplazarse por el mapa, al soltar se plantaba en la posicion donde se hizo click. El usuario queria moverse, no plantar.
**Causa raiz**: Dos problemas combinados:
1. El evento `click` se dispara siempre despues de `pointerup`, sin importar si hubo movimiento.
2. Las variables `wasDragging`/`pointerDownScreen` eran locales al `useEffect`. El objeto `viewport` es una referencia nueva en cada render, lo que causa que el useEffect se re-ejecute (cada 100ms por el interval de `scaleDisplay`). Al re-ejecutarse, las variables locales se reinician a `false`/`null`, perdiendo el estado de drag entre pointermove y click.
**Solucion**: Mover `wasDraggingRef` y `pointerDownScreenRef` a refs de React (useRef) que persisten entre re-renders. Trackear movimiento >5px como threshold, ignorar click si hubo drag.
**Archivos modificados**: `pixi-mapa-terreno-inner.tsx`

## Fuentes
- [PixiJS v8 ParticleContainer](https://pixijs.com/8.x/guides/components/scene-objects/particle-container)
- [PixiJS v8 Migration Guide](https://pixijs.com/8.x/guides/migrations/v8)
- [PixiJS React v8](https://pixijs.com/blog/pixi-react-v8-live)
- [ParticleContainer Blog Post](https://pixijs.com/blog/particlecontainer-v8)
- [RBush - Spatial Index](https://github.com/mourner/rbush)
