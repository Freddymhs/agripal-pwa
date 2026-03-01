# FASE 16: Registro de Cosechas (UI)

**Status**: ⏳ PENDIENTE
**Prioridad**: 🟡 MEDIA
**Dependencias**: FASE_12 (Supabase DB — tabla `cosechas` en PostgreSQL)
**Estimación**: 3-4 horas
**Última revisión**: 2026-03-01

---

## Estado Real del Código (auditado 2026-03-01)

| Aspecto                                  | Estado                                                |
| ---------------------------------------- | ----------------------------------------------------- |
| Modelo `Cosecha` en `src/types/index.ts` | ✅ Existe                                             |
| Tabla `cosechas` en IndexedDB (Dexie)    | ✅ Existe                                             |
| Tabla `cosechas` en Supabase             | ✅ Se crea en FASE_12                                 |
| DAL `cosechasDAL`                        | ❌ NO existe — debe crearse `src/lib/dal/cosechas.ts` |
| Página `/cosechas`                       | ❌ NO existe                                          |
| Formulario de registro                   | ❌ NO existe                                          |
| Hook `use-cosechas.ts`                   | ❌ NO existe                                          |

---

## Objetivo

Dar al usuario una UI para registrar sus cosechas reales y compararlas con las proyecciones del ROI. Cerrar el ciclo del planner: planificar → ejecutar → registrar resultado.

---

## Funcionalidades

### UI principal `/cosechas`

- Formulario de registro:
  - Zona (selector de zonas del terreno activo)
  - Cultivo (del catálogo de esa zona)
  - Fecha de cosecha
  - Cantidad en kg
  - Calidad: A / B / C
  - Precio de venta (CLP/kg) — opcional
  - Destino: consumo propio / venta local / exportación — opcional
  - Notas

- Historial de cosechas:
  - Lista cronológica por zona
  - Filtros: fecha, zona, cultivo, calidad
  - Total kg por período

- Gráficos de producción:
  - kg/mes por zona (barras)
  - Cosecha real vs proyección `calcularROI()` (líneas)
  - Ingreso real vs proyectado

### Métricas a calcular

- kg/m² por zona
- kg/planta promedio
- Ingresos totales vs proyectados (desde `roi.ts`)
- Precio promedio por kg
- Comparación entre temporadas

---

## Archivos a crear/modificar

| Archivo                              | Acción                                                 |
| ------------------------------------ | ------------------------------------------------------ |
| `src/lib/dal/cosechas.ts`            | Crear si no existe (CRUD en Dexie + Supabase)          |
| `src/hooks/use-cosechas.ts`          | Crear                                                  |
| `src/app/cosechas/page.tsx`          | Crear                                                  |
| `src/app/cosechas/error.tsx`         | Crear                                                  |
| `src/components/cosechas/`           | Crear carpeta con formulario, historial, gráficos      |
| `src/lib/constants/routes.ts`        | Agregar `ROUTES.COSECHAS = "/cosechas"`                |
| `src/components/layout/page-nav.tsx` | Agregar `/cosechas` en el menú principal de navegación |

---

## Notas de implementación

- Comparar cosecha real vs proyectada usando `calcularROI()` de `src/lib/utils/roi.ts`
- Para gráficos: usar la misma librería que `/economia` para consistencia
- Calidad A/B/C afecta el precio: A = precio lleno, B = 80%, C = 60% (ajustar según catálogo)
- Las cosechas son parte del sync via `SupabaseAdapter` (entidad `cosecha` ya está en `SYNC_ENTIDADES`)
