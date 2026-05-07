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
- **Granularidad del dato vinculado**: en componentes a nivel zona/entidad-hijo, resolver el dato vinculado vía la FK específica (ej. `zona.estanque_id` → estanque concreto), NO usar el agregador del padre (promedio del proyecto). Si el archivo ya tiene patrón establecido para resolver la entidad vinculada, seguirlo. El promedio engaña silenciosamente cuando la entidad hija tiene valor distinto del agregado.
- **Alinear null/falsy checks con el patrón del archivo**: si varios componentes en el mismo archivo manejan un valor opcional, alinear el check al patrón ya usado. Si el archivo usa `!valor` (captura null y 0), no introducir `valor === null` aislado. Para valores derivados de `Math.round()` o cocientes, `0` puede ser un resultado real — tratarlo como `null` cuando representa "ausencia significativa".
- **Numeración secuencial de secciones**: si un componente usa `{/* N. ... */}` para numerar secciones (convención del módulo `mapa/`), al insertar una sección nueva renumerar todas las posteriores. Sin saltos ni duplicados.
- **Deduplicar updates desde listeners externos**: cuando un listener (Supabase `onAuthStateChange`, WebSocket, BroadcastChannel, postgres_changes) emite el mismo dato lógico repetidamente, comparar por id/clave estable antes de `setState`. Patrón: `setState(prev => prev?.id === next?.id ? prev : next)`. Razón: Supabase Auth dispara `TOKEN_REFRESHED`/`SIGNED_IN` en cada `visibilitychange`, y un objeto nuevo con mismo contenido propaga rerenders + refetches en cascada por todos los consumidores que tengan el objeto en sus deps.
- **Auditorías de integridad: detección determinística sobre estadística cuando los datos pueden estar masivamente contaminados**: si el bug puede afectar a >50% de las filas, la mediana/percentil del dominio se contamina y marca los pocos datos correctos como outliers. Preferir reglas del dominio (regex sobre formatos conocidos, comparación contra valor esperado calculable) sobre umbrales estadísticos. Patrón aplicado en `scripts/safe/audit/integridad-dominio.ts` para detectar el bug del adapter ODEPA cuando la mediana de Palta estaba en $188/kg ($2k+ real).
- **`scripts/` se organiza por riesgo, no por propósito**: top-level son `lib/` (helpers neutrales), `danger/` (requiere env var de confirmación, puede dañar BD) y `safe/` (read-only o idempotente). Subdivisiones por propósito (`audit/`, `seed/`, `seed-layouts/`) viven dentro de `safe/`. Antes de agregar un script nuevo, decidir su bucket por blast-radius primero — un script destructivo no va en `safe/seed/` aunque sea conceptualmente un seed.
- **Scripts exploratorios van a `_scratch/`, no se borran**: cuando se investiga un bug con scripts one-shot que revelaron información valiosa, mover a `scripts/safe/audit/_scratch/` con prefijo `_`. Borrar solo cuando la causa raíz esté arreglada Y la información ya sea reproducible desde el audit recurrente. Razón: el trabajo de investigación documenta el proceso y sirve de regression check si el bug vuelve.

## Patrones de este proyecto

- **Datos globales vs per-proyecto**: las tablas `*_base` son globales (seed). Al crear un proyecto, triggers copian datos a tablas per-proyecto. La PWA lee ambas.
- **Puente entre IDs**: las tablas per-proyecto tienen UUID propio + campo TEXT que preserva el ID global original. Para joins con tablas globales (precios, variedades, mercado) → usar el campo TEXT puente, nunca el UUID.
- **Completitud de entidad**: una entidad necesita datos en múltiples tablas globales para estar "disponible". Existe un helper centralizado para validar esto — usarlo, no reimplementar inline.
- **Seed data como cadena**: agregar una entidad nueva al seed requiere entradas en todos los archivos relacionados. Si falta uno, la entidad queda incompleta y no disponible.
- **Supabase `select('*')` devuelve `any`**: castear siempre: `(data ?? []) as TipoEsperado[]`. Para `.single()` usar variable intermedia: `const res = await ...; return res.data as Tipo`.

## Migraciones SQL

- `IF NOT EXISTS` / `IF EXISTS` en todo DDL. Idempotencia obligatoria.
- FK nueva → index. Trigger que copia base → proyecto → actualizar para incluir columna nueva.
- Backfill de datos existentes → migración separada.
- **Tablas nuevas requieren consumidor real**: antes de crear una tabla, verificar que tenga consumidor en código. Si la PWA leerá → DAL + tipos en `src/types/`. Si la API escribirá → `repository.ts` y/o `*.cron.ts` en `agriplan-api-nestjs`. Sin consumidor implementado, NO crear la tabla.
- **Patrón de tablas escritas por la API** (mismo Supabase compartido): `UNIQUE` constraint para upsert, **sin** RLS habilitado, **sin** trigger `updated_at`. Ejemplos: `publicaciones_inia`, `clima_diario`, `precios_historico`.

## Decisiones de UI

- Navegación primaria: solo acciones de uso diario. Todo lo demás en menú secundario.
- Features nuevas: valor concreto al usuario, no satura interfaz, v1 mínima.
- Componentes máx 1000 líneas. Si supera → subcomponentes o hooks.

## Ubicación de datos

- Inmutable (fórmulas, umbrales físicos) → constante en código.
- Crece o se actualiza (catálogos, entidades) → base de datos.
- Personalizable por usuario → tabla per-proyecto, copiada desde base global.
- Sin tabla aún → carpeta pendiente, nunca importar en producción.
- Componentes nunca importan datos de catálogo desde archivos locales.

## Fuentes de datos — confirmado

- `src/lib/data/` NO contiene datos de negocio. Solo tipos TypeScript + constantes agronómicas universales: coeficientes Kc FAO (`coeficientes-kc.ts`), duraciones de etapas (`calculos-etapas.ts`), umbrales físicos (`umbrales-agua.ts`, `umbrales-suelo.ts`). Correcto por diseño — no cambian por mercado.
- Todo dato de negocio (precios, clima, ET0) viene de Supabase vía `baseDataDAL` → `useDatosBase()` → `ProjectContext`.
- `/economia`, `/agua`, `/escenarios`, `/plagas`, `/gantt` leen datos reales de Supabase.

## Balance hídrico y lluvia

`src/lib/utils/agua.ts` ya descuenta `lluvia.anual_mm` del consumo semanal (promedio anual dividido en semanas).
Mejora futura pendiente: usar precipitación diaria real desde `clima_actual` en lugar del promedio anual. Para Arica (23mm/año) el impacto es mínimo — no es urgente.

## Gantt de labores — implementado

`/gantt` está completamente implementado: `useTareasGantt` hook, persistencia en Supabase, componentes `GanttFila`, `GanttTotales`, `GanttEsteMes`, `GanttTareaModal`.
