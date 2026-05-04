# FASE 23 — Feedback Loop: El Agricultor Sabe Si Va Bien

**Estado:** ⏳ PENDIENTE — dependencias cumplidas, parcialmente iniciada
**Prioridad:** Alta — sin esto la app funciona para el creador, no para el usuario real
**Dependencias:** ✅ FASE_9 (Alertas), ✅ ROI implementado (roi.ts funcional)

> **Progreso al 2026-04-10:**
>
> - ✅ `precio_agua_break_even` implementado en `ProyeccionROI`
> - ✅ Dual pricing feria/mayorista en `/economia`
> - ✅ ROI 10 años via `extenderROI10Años()`
> - ✅ `KR_POR_AÑO`, `FRACCION_LAVADO`, `FACTOR_EFICIENCIA_RIEGO` como constantes
> - ✅ Mejora C — `BreakEvenAgua` ahora compara relativo al costo real del proveedor (rojo si sobre el límite, tooltip con contexto)
> - ✅ Mejora A — ROI estimado inline en panel de zona (`zona-cultivo-panel.tsx`): muestra ROI, meses recuperación, agua máx tolerable vs costo real del proveedor
> - ❌ Mejora B — descartada (ver razón abajo)
> - ❌ Mejora D — descartada (ver razón abajo)

---

## El Problema Real

La app tiene toda la inteligencia necesaria — fórmulas ROI calibradas, break-even por cultivo, agua máxima tolerable. Pero esa inteligencia aparece solo en `/economia`, después de que el usuario ya configuró todo. Si el resultado es rojo, el usuario no sabe qué cambiar ni cuánto.

Un agricultor que ve "ROI -340%" no sabe qué hacer. Uno que ve "agua máxima tolerable: $5,890/m³ — tu proveedor cobra $8,200/m³" puede actuar.

---

## Scope Revisado — Solo lo seguro

### Lo que SÍ se implementa

| Mejora | Descripción | Riesgo |
|--------|-------------|--------|
| **C (reducida)** | Mostrar `precio_agua_break_even` y simulación feria/mayorista en `/economia` | Bajo — datos ya calculados |
| **A** | ROI estimado inline en el panel de zona del mapa | Bajo — una llamada a `calcularROI()` con datos ya disponibles |

### Lo que NO se implementa (y por qué)

| Descartado | Razón |
|------------|-------|
| Detección de "causa principal" | Frágil — si hay múltiples causas simultáneas (agua cara + pocas plantas + suelo malo), elegir una sola puede mentirle al usuario |
| Loop `calcularMinimoPlantasParaViabilidad()` | Performance — iterar 1..10000 sin memoización es perceptible en renders. El valor no justifica la complejidad |
| Mejora B — calculadora inversa proveedor | Duplica lógica que ya existe. Complejidad alta, valor incremental bajo frente a lo que ya muestra `/economia` |
| Mejora D — wizard creación terreno | Scope enorme (5 componentes nuevos, flujo multi-paso). Para una app que ya tiene usuarios avanzados, es prematuro |

---

## Mejora C (alcance reducido) — Datos Clave en /economia

**Impacto: ALTO | Esfuerzo: BAJO | Riesgo: NULO**

Mostrar dos datos accionables junto a cada cultivo en `/economia`:

### 1. Agua máxima tolerable

```
Tomate Cherry — ROI 340%
Agua máx tolerable: $8,400/m³   (tu proveedor: $6,292/m³ ✅)
```

```
Ají/Pimiento — ROI -82%
Agua máx tolerable: $4,100/m³   (tu proveedor: $6,292/m³ ✗ — $2,192 sobre el límite)
```

El dato `precio_agua_break_even` ya existe en `ProyeccionROI`. Solo falta mostrarlo con contexto.

### 2. Simulación precio feria vs mayorista

```
Tomate Cherry
  Mayorista: ROI 340% · recupera en 8 meses
  Feria:     ROI 580% · recupera en 5 meses  ← llamar a calcularROI() con precio_feria
```

**Archivos a modificar:**
- `src/app/(app)/economia/page.tsx` — agregar sección por cultivo con estos dos datos
- No requiere componente nuevo si el markup es simple (< 20 líneas por cultivo)

**Datos ya disponibles:**
- `proyeccion.precio_agua_break_even` — ya calculado en `ProyeccionROI`
- `costoAguaM3` — ya disponible en el contexto de `/economia`
- `calcularROI()` — llamar una segunda vez con `precio_feria` para la comparación

**Lo que NO hacer:**
- No detectar "causa principal" — mostrar el dato crudo, que el usuario saque su conclusión
- No crear componente `<SemaforoRoi>` separado — el markup va inline en la página, es puntual

---

## Mejora A — ROI Estimado Inline en Panel de Zona

**Impacto: MUY ALTO | Esfuerzo: MEDIO | Riesgo: BAJO**

Cuando el usuario selecciona una zona de cultivo en el mapa, el panel lateral muestra el ROI estimado calculado con los datos reales del terreno.

**Diseño UI:**

```
Ajo Morado · Zona Huerto Norte
189 plantas

ROI estimado     9,888%  ✅
Recupera en      1 mes
Agua máx         $37,928/m³
Inversión        $460
```

Si no hay proveedor de agua configurado:

```
ROI estimado     —
Configura el proveedor de agua primero
```

**Archivos a modificar:**
- `src/components/mapa/zona-cultivo-panel.tsx` — agregar sección ROI con los datos disponibles en el panel

**Datos disponibles en el panel (sin fetch nuevo):**
- `zona` — área, tipo riego
- `cultivo` — desde `catalogoCultivos`
- `numPlantasVivas` — ya se calcula
- `costoAguaM3` — desde `terreno.agua_costo_clp_por_m3`

**Función a llamar:**
- `calcularROI()` de `src/lib/utils/roi.ts` — ya existe, una sola llamada

**Lo que NO hacer:**
- No iterar para calcular "mínimo de plantas" — mostrar solo el ROI actual
- No mostrar causa del problema — solo el número y el `precio_agua_break_even`

---

## Funciones Existentes que Esta Fase Reutiliza

| Función | Archivo | Usada en |
|---------|---------|----------|
| `calcularROI()` | `src/lib/utils/roi.ts` | Mejoras A y C |
| `precio_agua_break_even` | Campo de `ProyeccionROI` | Mejora C |
| `punto_equilibrio_meses` | Campo de `ProyeccionROI` | Mejoras A y C |

---

## Criterios de Aceptación

### Mejora C

- [ ] Cada cultivo en `/economia` muestra su `precio_agua_break_even`
- [ ] Se compara visualmente con el `costoAguaM3` real del terreno (✅ dentro / ✗ fuera)
- [ ] Se muestra ROI alternativo con precio feria junto al ROI con precio mayorista
- [ ] Si el ROI es positivo con feria pero negativo con mayorista, se destaca la diferencia

### Mejora A

- [ ] Al seleccionar zona con cultivo plantado, el panel muestra ROI estimado
- [ ] ROI positivo se muestra en verde con meses de recuperación y agua máx tolerable
- [ ] ROI negativo se muestra en rojo con agua máx tolerable
- [ ] Si no hay proveedor de agua configurado, muestra aviso en lugar del ROI
- [ ] El cálculo usa `costoAguaM3` real del terreno (no hardcodeado)

---

## Orden de Implementación

1. **Mejora C** — primero, porque modifica una página existente con datos ya calculados. Sin riesgo.
2. **Mejora A** — segundo, porque agrega lógica a un panel del mapa (más superficie de error).

---

## Lo que Esta Fase NO Es

- No rediseña `/economia`
- No cambia la fórmula del ROI
- No agrega tablas ni migraciones
- No tiene lógica de diagnóstico automático de causas
- No tiene flujos multi-paso ni wizards
