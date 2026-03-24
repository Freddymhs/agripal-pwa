# FASE_24 — Tests de Integración (Grupo C)

**Estado:** ⏳ Pendiente
**Prioridad:** Media
**Prerequisito:** Grupo A (✅ completado) + Grupo B (✅ completado) + Grupo D (✅ completado)

---

## Contexto

El proyecto ya tiene cobertura completa de:

- **Grupo A** — funciones puras sin dependencias (`utils/`, `lib/data/`)
- **Grupo B** — gaps en tests existentes (alertas, plagas, calidad, zona, etc.)
- **Grupo D** — restricciones arquitectónicas (`src/__tests__/architecture.test.ts`)

Lo que falta son **tests de integración** que validan la orquestación entre capas
(hooks + DAL + lógica de negocio), mockeando Supabase en lugar de un emulador real.

---

## Objetivos

### C1 — `src/lib/helpers/dal-mutation.ts`

El wrapper centralizado de mutaciones. Cualquier bug aquí afecta todas las escrituras.

| Caso                | Qué validar                                      |
| ------------------- | ------------------------------------------------ |
| Mutación exitosa    | `refetchCallback` se llama después de escribir   |
| Error de Supabase   | Se propaga correctamente al caller               |
| Logger centralizado | Se invoca con nivel y mensaje esperado           |
| `isMounted` guard   | No llama refetch si el componente ya se desmontó |

**Setup:** `vi.mock("@/lib/dal")` + spy en el logger.

---

### C2 — `src/hooks/use-recomendacion.ts`

Hook que combina validación de terreno + cálculo de recomendación de cultivos.

| Caso                  | Qué validar                                                 |
| --------------------- | ----------------------------------------------------------- |
| Sin datos de terreno  | Devuelve estado `loading` o `null`                          |
| Terreno con estanques | `calcularRecomendacionCultivos` recibe parámetros correctos |
| Terreno sin agua      | Resultado tiene `cultivos_viables = []`                     |
| Cambio de proyecto    | Re-ejecuta con nuevos datos (no reutiliza caché vieja)      |

**Setup:** `vi.mock("@/lib/dal")` + `renderHook` de `@testing-library/react`.

---

### C3 — `src/hooks/use-actualizar-etapas.ts`

Hook que orquesta la actualización de etapas de crecimiento de plantas.

| Caso                     | Qué validar                              |
| ------------------------ | ---------------------------------------- |
| Planta sin etapa_actual  | Se calcula y persiste la etapa correcta  |
| Planta ya en etapa final | No muta innecesariamente                 |
| Error en DAL             | El hook no queda en estado inconsistente |
| Múltiples plantas        | Se actualizan en batch, no una a una     |

**Setup:** `vi.mock("@/lib/dal")` + `vi.useFakeTimers` para controlar `new Date()`.

---

### C4 — `src/lib/dal/*.ts` (selectivo)

No testear todo el DAL (requeriría emulador). Testear solo los DALs con lógica
no trivial que no es simple CRUD:

| DAL               | Lógica a testear                                     |
| ----------------- | ---------------------------------------------------- |
| `alertas-dal.ts`  | Deduplicación al sincronizar (no inserta duplicados) |
| `plantas-dal.ts`  | Serialización/deserialización del campo JSONB        |
| `terrenos-dal.ts` | `upsert` con columnas explícitas vs bucket JSONB     |

**Setup:** Mock de Supabase client con `vi.fn()` que simula respuestas `.data`/`.error`.

---

## Setup común para todos los tests C

```ts
// Patrón base para mockear Supabase
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
    })),
  })),
}));
```

Para hooks: usar `renderHook` + `act` de `@testing-library/react`.

```bash
# Dependencias necesarias (ya instaladas en el proyecto)
pnpm add -D @testing-library/react @testing-library/react-hooks
```

---

## Estimación

| Tarea                    | Complejidad | Tests estimados  |
| ------------------------ | ----------- | ---------------- |
| C1 dal-mutation          | Baja        | 4-6              |
| C2 use-recomendacion     | Media       | 4-5              |
| C3 use-actualizar-etapas | Media-Alta  | 4-6              |
| C4 DAL selectivo         | Media       | 6-9              |
| **Total**                |             | **~18-26 tests** |

---

## Notas

- Los tests C **no sustituyen** tests E2E con Supabase real. Son complementarios.
- Si el proyecto incorpora un emulador de Supabase (Supabase local), estos tests
  deberían migrar a integración real en lugar de mocks.
- El Grupo C tiene sentido cuando los hooks C2/C3 ya estén estabilizados y no
  cambien estructura frecuentemente (alta volatilidad → alta deuda de mantenimiento en tests).
