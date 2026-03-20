# CLAUDE.md - AgriPlan PWA

## Arquitectura

- Flujo de datos: Componente → Hook → DAL → Supabase. Sin intermediarios ni cache layer.
- Componentes renderizan. Hooks manejan lógica y estado. DAL accede a datos. No mezclar capas.
- Un DAL por dominio. Devuelve tipos, nunca objetos crudos.
- Serialización via funciones centralizadas del schema — columnas explícitas + bucket JSONB para el resto.
- Toda columna SQL nueva → 4 pasos obligatorios: migración, schema, tipos TS, DAL.

## Convenciones elegidas

- **Sin librería de cache/fetching** (TanStack Query, SWR, etc). Fetching manual: `useState` + `useEffect` + `useCallback` → DAL.
- **Mutaciones centralizadas**: toda escritura a BD pasa por un wrapper único que logea, refresca y maneja errores. Sin excepciones.
- **Wrappers obligatorios**: timestamps y UUIDs siempre via funciones centralizadas. Prohibido `new Date().toISOString()` o `crypto.randomUUID()` inline.
- **`eslint --fix` elimina disable comments** antes de evaluar. No usar `eslint-disable` como workaround — refactorizar.
- **Prohibido `setState` dentro de `useEffect`**. Usar "adjusting state during render": comparar valor actual vs previo en body del componente.
- **Prohibido mutar refs durante render**. Solo en effects o event handlers.
- **Validar estado tras cambio de contexto**: si el usuario cambia de proyecto/entidad padre, verificar que IDs en estado local siguen existiendo en los nuevos datos. No asumir que un ID guardado sigue siendo válido tras refetch.
- **Estabilizar refs en dependencias**: usar `useMemo(() => valor ?? default, [valor])` en lugar de `valor ?? default` inline en deps de otros hooks. Expresiones con fallback crean refs nuevas cada render.

## Patrones de este proyecto

- **Datos globales vs per-proyecto**: las tablas `*_base` son globales (seed). Al crear un proyecto, triggers copian datos a tablas per-proyecto. La PWA lee ambas.
- **Puente entre IDs**: las tablas per-proyecto tienen UUID propio + campo TEXT que preserva el ID global original. Para joins con tablas globales (precios, variedades, mercado) → usar el campo TEXT puente, nunca el UUID.
- **Completitud de entidad**: una entidad necesita datos en múltiples tablas globales para estar "disponible". Existe un helper centralizado para validar esto — usarlo, no reimplementar inline.
- **Seed data como cadena**: agregar una entidad nueva al seed requiere entradas en todos los archivos relacionados. Si falta uno, la entidad queda incompleta y no disponible.

## Migraciones SQL

- `IF NOT EXISTS` / `IF EXISTS` en todo DDL. Idempotencia obligatoria.
- FK nueva → index. Trigger que copia base → proyecto → actualizar para incluir columna nueva.
- Backfill de datos existentes → migración separada.

## Decisiones de UI

- Navegación primaria: solo acciones de uso diario. Todo lo demás en menú secundario.
- Features nuevas: valor concreto al usuario, no satura interfaz, v1 mínima.
- Componentes máx 400 líneas. Si supera → subcomponentes o hooks.

## Ubicación de datos

- Inmutable (fórmulas, umbrales físicos) → constante en código.
- Crece o se actualiza (catálogos, entidades) → base de datos.
- Personalizable por usuario → tabla per-proyecto, copiada desde base global.
- Sin tabla aún → carpeta pendiente, nunca importar en producción.
- Componentes nunca importan datos de catálogo desde archivos locales.
