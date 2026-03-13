# FASE 22 — Offline-First con PowerSync

**Estado:** PENDIENTE / NO INICIADA
**Prioridad:** Baja — implementar solo después de validar necesidad real con usuarios

---

## Contexto

La app actualmente es **online-only**: UI → Hook → DAL → Supabase directo.

Un intento anterior de offline-first basado en **Dexie + sync engine custom** fue removido completamente (refactor FASE 13). Las razones del fallo:

- **Conflict resolution sin solución simple** — ediciones simultáneas en múltiples dispositivos dejaban datos corruptos en Supabase (bug crítico: `datos` JSONB sobreescrito parcialmente).
- **IndexedDB es frágil** — el browser puede limpiarlo sin aviso (modo privado, espacio en disco, políticas del SO), perdiendo todos los datos locales sin explicación para el usuario.
- **Doble fuente de verdad** — cada feature debía resolver si el dato venía de IndexedDB o de Supabase y cuál era más reciente, multiplicando la complejidad de cada cambio.
- **Complejidad desproporcionada** — ~10 archivos de infraestructura sync custom replicando lo que herramientas especializadas ya resuelven con años de ingeniería detrás.

---

## Solución correcta: PowerSync

PowerSync se conecta **encima de Supabase** sin reemplazarlo:

```
App
 └─► PowerSync SDK (SQLite local en el dispositivo)
       └─► PowerSync Cloud (servicio de sincronización)
             └─► Supabase PostgreSQL  ← sigue siendo la fuente de verdad
```

**Lo que NO cambia:**

- Esquema de tablas en Supabase
- RLS (Row Level Security)
- Autenticación con Supabase Auth
- La lógica de negocio

**Lo que SÍ cambia:**

- Los DALs leen desde SQLite local (PowerSync SDK) en lugar del cliente Supabase
- Las escrituras van al servidor vía PowerSync (que las replica a Supabase)
- Se define qué datos sincronizar por usuario mediante "sync rules"

```typescript
// Hoy (online-only)
const { data } = await supabase
  .from("terrenos")
  .select("*")
  .eq("proyecto_id", id);

// Con PowerSync (offline-first)
const { data } = await db.getAll(
  "SELECT * FROM terrenos WHERE proyecto_id = ?",
  [id],
);
```

---

## Cuándo implementarlo

**No antes de validar** que los usuarios realmente necesitan escritura offline. Preguntas previas obligatorias:

1. ¿Los usuarios editan datos en campo sin conexión, o solo consultan?
2. ¿Con qué frecuencia pierden conexión durante el uso activo de la app?

**Según la respuesta:**

| Necesidad                                           | Solución                                   | Esfuerzo     |
| --------------------------------------------------- | ------------------------------------------ | ------------ |
| Solo lectura offline (ver mapa, consultar datos)    | TanStack Query con `persistQueryClient`    | ~2 días      |
| Lectura + escrituras básicas offline                | PowerSync                                  | ~1-2 semanas |
| Todo completamente offline con conflictos complejos | PowerSync + diseño cuidadoso de sync rules | ~1 mes       |

---

## Regla para agentes

**Prohibido** implementar sync engines, colas de sincronización o resolución de conflictos con código propio. Si se necesita offline-first, usar PowerSync. Si se necesita solo lectura offline, usar TanStack Query con persistencia. El intento anterior costó semanas de desarrollo y dejó una deuda técnica que requirió un refactor completo para eliminar.
