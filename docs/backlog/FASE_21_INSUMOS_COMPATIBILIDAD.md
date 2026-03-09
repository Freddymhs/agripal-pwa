# FASE_21 — Módulo Insumos y Compatibilidad Química

**Estado:** ✅ Completada
**Prioridad:** Alta
**Fecha:** 2026-03-08

---

## Objetivo

Permitir al agricultor registrar los insumos que usa (fertilizantes, fungicidas, correctores) y verificar offline si puede mezclarlos antes de aplicarlos. Prevenir daño al sistema de riego y pérdidas económicas por mezclas incompatibles.

---

## Archivos Creados

### `data/static/insumos/compatibilidad.json`

Matriz de compatibilidad química con:

- **15 insumos catalogados**: fertilizantes (MAP, DAP, nitrato Ca, KCl, SOP), enmiendas (yeso), fungicidas (cobre, fosfonato), insecticidas (abamectina), coadyuvantes (aceite mineral), correctores (quelato Fe), y otros.
- **15 combinaciones incompatibles** documentadas con nivel (alto/medio), razón química y recomendación operativa.

Casos críticos incluidos:

- Calcio + fosfatos → precipitación en goteros (nivel: alto)
- Hipoclorito + ácido fosfórico → liberación Cl₂ tóxico (nivel: alto)
- Hipoclorito + nitrato amonio → riesgo explosivo (nivel: alto)
- Abamectina + aceite mineral → fitotoxicidad (nivel: alto)
- Cobre + fosfonato → quelación e inactivación (nivel: alto)

### `src/lib/data/compatibilidad-insumos.ts`

Loader tipado del JSON. Funciones exportadas:

- `getMatrizCompatibilidad()` — retorna la matriz completa
- `getInsumos()` — retorna array de `InsumoCompatibilidad[]`
- `getInsumoById(id)` — búsqueda por ID
- `verificarCompatibilidad(ids[])` — retorna `IncompatibilidadQuimica[]` para los IDs dados
- `getNivelMayorIncompatibilidad(inc[])` — retorna `"alto" | "medio" | "ninguno"`

### `src/lib/dal/insumos.ts`

DAL para insumos registrados por el usuario en IndexedDB:

- `getAll()`, `getByTerrenoId(id)`, `add()`, `update()`, `delete()`

### `src/hooks/use-insumos.ts`

Custom hook con `useLiveQuery` de Dexie. Expone:

- `insumos: InsumoUsuario[]`
- `loading: boolean`
- `agregarInsumo(data)` — con timestamp automático
- `eliminarInsumo(id)`

### `src/app/(app)/insumos/page.tsx`

Página `/insumos` con:

1. **Selector** de insumos desde catálogo estático (datos offline)
2. **Lista** de insumos registrados en el terreno actual
3. **Modo chequeo** — selección múltiple con checkboxes
4. **Verificación** — resultado con nivel de riesgo, razón química y recomendación
5. **Eliminar** insumos registrados

---

## Archivos Modificados

- `src/lib/db/index.ts` — versión 3 con tabla `insumos_usuario`
- `src/lib/dal/index.ts` — exporta `insumosDAL`
- `src/lib/utils/alertas.ts` — función `generarAlertasIncompatibilidadQuimica()` exportada
- `src/types/index.ts` — tipos `InsumoCompatibilidad`, `IncompatibilidadQuimica`, `MatrizCompatibilidad`, `InsumoUsuario`

---

## Decisión de Arquitectura

- Los datos de compatibilidad son **estáticos** (JSON) — funciona 100% offline sin API.
- Los insumos del usuario se guardan en **IndexedDB** por `terreno_id` — persisten offline.
- La verificación es **client-side** — sin latencia, sin dependencia de red.
- El catálogo de insumos puede crecer sin cambiar código (solo agregar al JSON).

---

## Próximas Iteraciones

- Agregar alerta automática `incompatibilidad_quimica` en `sincronizarAlertas()` cuando el usuario tiene insumos incompatibles registrados juntos.
- Ampliar catálogo de insumos (actualmente 15; objetivo 30+).
- Permitir al usuario agregar insumos custom no listados en el catálogo.
