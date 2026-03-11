# FASE 15C: Bugs y Gaps — Registro Retroactivo de Tests E2E

**Status**: ✅ COMPLETA (13 bugs corregidos, GAP-01 implementado en FASE_8B)
**Prioridad**: 🔴 Alta
**Dependencias**: FASE_13 (descubiertos durante testing del pipeline sync)
**Fecha**: 2026-03-10

---

## Objetivo

Registrar retroactivamente todos los bugs encontrados y corregidos durante las sesiones de
tests E2E (TC-001 a TC-031) de FASE_13 que **no estaban documentados** en ninguna fase del
backlog anterior.

---

## Bugs Corregidos

### BUG-02 — Hook "updating" enviaba datos parciales → corrupción JSONB

**Encontrado en:** TC-002 / TC-003 (sync CRUD)
**Síntoma:** Actualizaciones de terrenos y zonas llegaban a Supabase con campos JSONB vacíos
o incompletos (configuración_riego, estanque_config).
**Root cause:** `src/lib/sync/db-hooks.ts` — el hook `updating` serializa solo el delta
(campos cambiados), no el objeto completo. Los campos JSONB necesitan el objeto entero.
**Fix:** Enviar objeto completo al construir el payload del hook `updating`.
**Archivos:** `src/lib/sync/db-hooks.ts`
**Estado:** ✅ Corregido

---

### BUG-04 — Push nunca llegaba a Supabase (Dexie PSD zone — TransactionInactiveError)

**Encontrado en:** TC-001 / TC-004 (activación sync + offline)
**Síntoma:** Items quedaban en estado `pendiente` indefinidamente. El adapter nunca procesaba
la cola. Console mostraba `TransactionInactiveError`.
**Root cause:** Dexie "PSD zone" — al leer IDB dentro de un transaction context activo,
cualquier operación async posterior lanza `TransactionInactiveError`. El engine encolaba
y luego intentaba leer desde dentro del mismo contexto.
**Fix:** `setTimeout(fn, 0)` en `enqueue.ts` para escapar la PSD zone vía macrotask.
**Archivos:** `src/lib/sync/enqueue.ts`, `src/lib/sync/sync-state.ts`,
`src/lib/dal/sync-meta.ts`, `src/lib/db/index.ts`
**Estado:** ✅ Corregido

---

### BUG-05 (sync) — Delete vía engine → race condition push/pull re-inserta la planta

> ⚠️ Este BUG-05 es **diferente** al BUG-05 de FASE_15B (que era sobre click en zona/estanque en modo ZONAS).

**Encontrado en:** TC-010 (sync CRUD plantas delete)
**Síntoma:** Una planta eliminada en IDB se subía como `delete` a Supabase, pero en el mismo
ciclo de sync el `pullChangesInternal` la re-insertaba porque aún aparecía en Supabase
(el push delete no había completado). El hook `creating` de Dexie encolaba un nuevo `create`.
Resultado: la planta nunca se borraba, reaparecía infinitamente.
**Root cause:** Race condition push → pull dentro del mismo ciclo sync. Pull no verifica si
existe un delete pendiente para ese `entidad_id`.
**Fix:** En `pullChangesInternal`, antes de re-insertar un item de Supabase verificar si
existe un item `pendiente` o `error` con `accion: 'delete'` para ese `entidad_id`. Si existe,
saltar la re-inserción.
**Archivos:** `src/lib/sync/engine.ts`
**Estado:** ✅ Corregido

---

### BUG-06 — MapInfoBar crash en terrenos creados sin dimensiones en canvas

**Encontrado en:** TC-012 (flujo completo terreno real Arica)
**Síntoma:** Al navegar al mapa con terrenos creados programáticamente vía IDB scripts
(sin canvas), la app crasheaba en `MapInfoBar` con división por cero o `NaN` en
`porcentaje_uso` y `dimensiones`.
**Root cause:** `use-project-dashboard.ts` asumía `ancho_m > 0` y `agua_actual_m3` definido.
MapInfoBar no guardaba contra `isFinite()`.
**Fix:**

- `src/hooks/use-project-dashboard.ts`: `ancho_m ?? 0`, `alto_m ?? 0`, `agua_actual_m3 ?? 0`
- `src/components/mapa/map-info-bar.tsx`: guard `isFinite(porcentaje_uso)`, mostrar `—` si dimensiones son 0
  **Archivos:** `src/hooks/use-project-dashboard.ts`, `src/components/mapa/map-info-bar.tsx`
  **Estado:** ✅ Corregido

---

### BUG-STRESS-01 — Crash al seleccionar planta con `etapa_actual` no reconocida

**Encontrado en:** TC-020 (stress 2000+ plantas)
**Síntoma:** Al hacer click en una planta creada con `etapa_actual: undefined` o valor fuera
del enum, `ETAPA_INFO[planta.etapa_actual].emoji` lanzaba `TypeError: Cannot read properties
of undefined`.
**Root cause:** Las plantas creadas masivamente via script no tenían `etapa_actual` válida.
`planta-info.tsx` accedía al lookup sin guard.
**Fix:** Fallback defensivo en PlantaInfo: si `etapa_actual` no existe en `ETAPA_INFO`,
usar `ETAPA.ADULTA` como default.
**Archivos:** `src/components/plantas/planta-info.tsx`
**Estado:** ✅ Corregido

---

### BUG-STRESS-02 — TypeError `planta.x.toFixed(1)` cuando `x` es null

**Encontrado en:** TC-020 (stress 2000+ plantas)
**Síntoma:** Plantas masivas con `x: null` / `y: null` crasheaban el panel PlantaInfo al
mostrar coordenadas.
**Fix:** `(planta.x ?? 0).toFixed(1)`, `(planta.y ?? 0).toFixed(1)`
**Archivos:** `src/components/plantas/planta-info.tsx`
**Estado:** ✅ Corregido

---

### BUG-RACE — useLiveQuery stale cache → race condition en carga directa

**Encontrado en:** TC-023 (race condition navegación directa)
**Síntoma:** Al navegar directamente a `/economia`, `/agua`, etc. (hard refresh), la página
mostraba "No hay terrenos creados" aunque el usuario tenía proyectos. El problema era que
`useLiveQuery` retorna el resultado anterior (no `undefined`) cuando cambia el `usuarioId`,
haciendo que el efecto `initialLoad` se disparara con `count=0` antes que llegaran los
proyectos reales.
**Root cause:** `useLiveQuery` no retorna `undefined` al cambiar deps — retorna el último
valor cacheado. El guard `result === undefined` no detectaba el estado stale.
**Fix:** Tagged result pattern en `use-proyectos.ts`:

```typescript
const result = useLiveQuery(
  async () => ({
    id: usuarioId,
    data: await proyectosDAL.getByUsuarioId(usuarioId),
  }),
  [usuarioId],
);
const loading = result === undefined || result.id !== usuarioId;
const proyectos = (result?.id === usuarioId ? result.data : undefined) ?? [];
```

**Archivos:** `src/hooks/use-proyectos.ts`, `src/contexts/project-context.tsx`
**Estado:** ✅ Corregido

---

### BUG-COSTO-AGUA — `estanque_config.costo_por_m3` ignorado en cálculo de ROI

**Encontrado en:** TC-024 (economía costo agua)
**Síntoma:** Economía mostraba "Costo Agua = $0" aunque el estanque tenía `costo_por_m3: 2500`
configurado. El ROI decía "Excelente rentabilidad" sin incluir el gasto real del agua.
**Root cause:** El campo `costo_por_m3` existía en IDB pero no estaba en el tipo TypeScript
`EstanqueConfig`, y tampoco en la cadena de prioridad de `obtenerCostoAguaPromedio` en `roi.ts`.
**Fix:**

- `src/types/index.ts`: Agregar `costo_por_m3?: number` a `EstanqueConfig`
- `src/lib/utils/roi.ts`: Agregar fallback `estanque.estanque_config?.costo_por_m3` en
  `obtenerCostoAguaPromedio` después de verificar `configuracion_recarga`
  **Archivos:** `src/types/index.ts`, `src/lib/utils/roi.ts`
  **Estado:** ✅ Corregido

---

### BUG-AREA-01 — `zona.area_m2` undefined en zonas antiguas → NaN en Escenarios y ROI

**Encontrado en:** TC-029 (escenarios comparar cultivos)
**Síntoma:** La página `/escenarios` mostraba `$NaN`, `NaN%` y `NaN meses` para zonas
creadas mediante scripts IDB que no almacenaban `area_m2` explícitamente (solo
`ancho` y `alto`).
**Root cause:** `compararCultivos` y `calcularROI` usaban `zona.area_m2` directamente.
Zonas del schema antiguo no tienen `area_m2` en IDB — las dimensiones están en `ancho` y
`alto` por separado.
**Fix:** Nuevo helper `resolverAreaZona` con fallback:

```typescript
export function resolverAreaZona(zona: Zona): number {
  return zona.area_m2 || zona.ancho * zona.alto;
}
```

Usado en `compararCultivos` y `calcularROI`. El selector de zona en `/escenarios` también
usa el mismo fallback para mostrar el área.
**Archivos:** `src/lib/utils/helpers-cultivo.ts`, `src/lib/utils/comparador-cultivos.ts`,
`src/lib/utils/roi.ts`, `src/app/(app)/escenarios/page.tsx`
**Estado:** ✅ Corregido

---

### BUG-CATALOGO-PRECIO — Campos precio_kg_min/max no editables en formulario

**Encontrado en:** TC-031 (catálogo cultivos personalizado)
**Síntoma:** El formulario de edición de cultivos tenía estado `precioMin`/`precioMax` y los
enviaba en `handleSubmit`, pero no renderizaba ningún `<input>` para esos campos. El usuario
no podía editar el precio desde la UI.
**Fix:** Agregar campos "Precio mín (CLP/kg)" y "Precio máx (CLP/kg)" al formulario
entre la sección Tier/Riesgo y la sección de Clima.
**Archivos:** `src/components/catalogo/cultivo-form.tsx`
**Estado:** ✅ Corregido

---

### BUG-SYNC-QUEUE — Items en estado `error` sin mecanismo de limpieza

**Encontrado en:** TC-004 / TC-028 (observación general de sync)
**Síntoma:** Items que alcanzan `MAX_RETRY_ATTEMPTS=5` quedan en estado `error`
indefinidamente en `sync_queue`. No existe UI ni mecanismo automático para purgar
estos items. La cola crece sin límite, y en reconexiones posteriores los items `error`
no se reintentan ni se eliminan.
**Root cause:** El engine marca items como `error` cuando se superan los reintentos,
pero no tiene lógica de cleanup. No hay botón "limpiar errores" en la UI de configuración
ni un job automático de TTL.
**Fix pendiente:**

- `src/lib/sync/engine.ts`: purgar items con status `error` al activar sync o pasado N días
- `src/app/(app)/configuracion/`: agregar botón "Limpiar errores de sincronización"
  **Archivos:** `src/lib/sync/queue.ts`, `src/app/(app)/configuracion/page.tsx`
  **Estado:** ✅ Corregido — `limpiarErroresPermanentes()` + UI en /configuracion (sección Mantenimiento visible cuando hay errores permanentes)

---

### BUG-PLANTA-INFO-NAN — Panel PlantaInfo muestra "Libre: NaNm2"

**Encontrado en:** TC-027 / TC-026 (observación post-plantar)
**Síntoma:** El panel `PlantaInfo` muestra "Libre: NaNm2" para la zona cuando la zona
no tiene `area_m2` explícito (zonas antiguas que solo tienen `ancho` y `alto`).
**Root cause:** `PlantaInfo` usa `zona.area_m2` directamente sin fallback.
El helper `resolverAreaZona` fue creado para `comparador-cultivos.ts` y `roi.ts`
(BUG-AREA-01) pero no se aplicó al componente `PlantaInfo`.
**Fix pendiente:**

- `src/components/plantas/planta-info.tsx`: usar `resolverAreaZona(zona)` donde
  se calcula el área libre: `const areaLibre = resolverAreaZona(zona) - areaOcupada`
  **Archivos:** `src/components/mapa/grid-automatico-modal.tsx` (bug real aquí, no en planta-info)
  **Estado:** ✅ Corregido — `resolverAreaZona(zona)` aplicado en `grid-automatico-modal.tsx`; modal muestra "Zona Cultivo Test (1200 m²)" correctamente

---

### BUG-COSTO-AGUA-02 — `costo_recarga_clp` no llega a Economía

**Encontrado en:** TC-024 (observación de flujo completo)
**Síntoma:** Si el usuario configura el costo del agua via "Configurar Recarga" en `/agua`,
el valor se guarda en `configuracion_recarga.costo_recarga_clp` (costo por llenado del
estanque completo). Pero `/economia` solo lee `estanque_config.costo_por_m3` (costo
por m³). El resultado es que la economía muestra "Costo Agua = $0" aunque el usuario
configuró un costo de recarga real.
**Root cause:** Dos campos distintos para el mismo concepto económico.
`obtenerCostoAguaPromedio()` en `roi.ts` lee `costo_por_m3` pero la UI de recarga
escribe `costo_recarga_clp`. No hay conversión entre ambos.
**Fix pendiente:**

- `src/lib/utils/roi.ts` → `obtenerCostoAguaPromedio()`: agregar fallback que derive
  `costo_por_m3` desde `costo_recarga_clp / capacidad_m3` cuando `costo_por_m3` es 0.
  **Archivos:** `src/lib/utils/roi.ts`
  **Estado:** ✅ Corregido — fallback implementado; Estanque A (25000/50) deriva 500 CLP/m³ correctamente

---

## Gaps Arquitecturales Confirmados (sin fix aún)

### GAP-01 — Multi-estanque sin asignación por zona

**Confirmado en:** TC-018
**Descripción:** No existe FK `zona_cultivo.estanque_id`. El consumo de agua descuenta del
pool global del terreno (`agua_actual_m3`) sin distinguir qué zona cultivo se riega desde
qué estanque. En un terreno con 2+ estanques independientes, esto no refleja la realidad.
**Impacto:** Bajo en la práctica actual (la mayoría de terrenos pequeños tiene 1 estanque).
**Para implementar:**

1. Agregar `estanque_id?: UUID` a interface `Zona` (para zonas tipo cultivo)
2. UI en panel de edición de zona para seleccionar estanque fuente
3. Lógica de consumo per-estanque en `use-project-dashboard.ts`
4. Migración de schema Supabase: columna `estanque_id` en tabla `zonas`
   **Status:** 📋 Backlog — candidato a **FASE_8B** o incorporar en FASE_13 revisión

---

### GAP-02 — `useTerrainData()` siempre retornaba `terrenos[0]` ✅ RESUELTO

**Confirmado en:** TC-013 / TC-017 (parcial)
**Descripción original:** `src/hooks/use-terrain-data.ts` usaba `terrenos[0]` hardcodeado.
Las páginas `/agua`, `/agua/planificador`, `/economia`, `/agua/configuracion` no respetaban
el terreno seleccionado en el mapa.
**Resolución:** El hook `useTerrainData` fue eliminado completamente. Todas las páginas
migraron a `useProjectContext()` que sí respeta el terreno activo guardado en localStorage.
**Verificado:** `grep -r "useTerrainData"` → 0 importaciones fuera del propio hook.
**Status:** ✅ Resuelto

---

### GAP-03 — `tipo_cultivo_id` como slug en scripts de test en lugar de UUID real

**Confirmado en:** TC-012 / TC-013
**Descripción:** Los scripts IDB de test creaban plantas con `tipo_cultivo_id: 'naranjo'`
(slug) en lugar del UUID real del catálogo. Esto hacía que el Kc no se resolviera,
el consumo usara el default 0.5, y las alertas de zona aparecieran como "sin cultivos".
**Impacto:** Solo afecta scripts de test, no código de producción. La UI siempre usa el UUID
real del catálogo al plantar.
**Resolución:** Los scripts de test actualizados a partir de TC-013 usan UUIDs reales del
catálogo IDB.
**Status:** ✅ Resuelto (solo en scripts de test, no en código de producción)

---

## Resumen

| Bug/Gap                          | Encontrado en | Archivos                                                                     | Status     |
| -------------------------------- | ------------- | ---------------------------------------------------------------------------- | ---------- |
| BUG-02 Sync hook updating JSONB  | TC-002/003    | db-hooks.ts                                                                  | ✅         |
| BUG-04 Dexie PSD zone push       | TC-001/004    | enqueue.ts, sync-state.ts                                                    | ✅         |
| BUG-05 Delete race condition     | TC-010        | engine.ts                                                                    | ✅         |
| BUG-06 MapInfoBar crash NaN      | TC-012        | map-info-bar.tsx, use-project-dashboard.ts                                   | ✅         |
| BUG-STRESS-01 etapa_actual crash | TC-020        | planta-info.tsx                                                              | ✅         |
| BUG-STRESS-02 x/y null crash     | TC-020        | planta-info.tsx                                                              | ✅         |
| BUG-RACE useLiveQuery stale      | TC-023        | use-proyectos.ts, project-context.tsx                                        | ✅         |
| BUG-COSTO-AGUA costo_por_m3      | TC-024        | types/index.ts, roi.ts                                                       | ✅         |
| BUG-AREA-01 area_m2 undefined    | TC-029        | helpers-cultivo.ts, comparador-cultivos.ts, roi.ts                           | ✅         |
| BUG-CATALOGO-PRECIO form         | TC-031        | cultivo-form.tsx                                                             | ✅         |
| BUG-SYNC-QUEUE cleanup           | TC-004/028    | queue.ts, configuracion/page.tsx                                             | ✅         |
| BUG-PLANTA-INFO-NAN Libre NaNm2  | TC-027/026    | grid-automatico-modal.tsx (resolverAreaZona)                                 | ✅         |
| BUG-COSTO-AGUA-02 recarga_clp    | TC-024        | roi.ts (fallback costo_recarga_clp/capacidad_m3)                             | ✅         |
| GAP-01 Multi-estanque FK         | TC-018        | types/index.ts, zona-cultivo-panel.tsx, alertas.ts, 002_zona_estanque_id.sql | ✅ FASE_8B |
| GAP-02 useTerrainData            | TC-013/017    | eliminado                                                                    | ✅         |
| GAP-03 tipo_cultivo_id slug      | TC-012/013    | scripts test                                                                 | ✅         |
