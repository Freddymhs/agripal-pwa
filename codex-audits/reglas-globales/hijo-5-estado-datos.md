# Hijo 5 – Estado y Datos

Alcance: estado global/contextos, derivación vs duplicación, consistencia de datos cargados.

Hallazgos positivos:
- `ProjectContext` y `MapContext` usan `useMemo`/`useCallback` para datos derivados (espaciados por cultivo, colores, plantas por zona) y mantienen el estado seleccionado separado del listado.
- Persistencia de selección con `STORAGE_KEYS` en localStorage para proyecto/terreno; carga inicial con `initialLoad` y reuso de `cargarDatosTerreno` para refrescar zonas/plantas.

Riesgos / brechas:
- `src/contexts/project-context.tsx:100` pasa `terrenoActual!` a `useZonas`; durante renders iniciales `terrenoActual` es `null`, lo que puede romper si algún handler se llama antes de setear el terreno. Debería guardear el hook hasta tener terreno o usar una versión que acepte `null`.
- `use-terrenos.ts` usa `proyectoId!` en `queryKey` e invalidaciones; hoy las mutaciones se llaman solo con id, pero es fácil disparar `invalidateQueries` con `null` y contaminar cache si se reusa el hook en otro contexto.
- Estados de loading: `cargarDatosTerreno` solo muestra loading en la primera carga (`initialLoadDone`), por lo que un cambio de terreno grande podría no mostrar spinner; validar si es intencional para la UX.
