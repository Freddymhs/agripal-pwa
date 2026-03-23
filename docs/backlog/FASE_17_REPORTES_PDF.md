# FASE 17: Reportes y Exportación PDF

**Status**: ✅ COMPLETADA — 2026-03-21
**Prioridad**: 🟡 MEDIA
**Dependencias**: FASE_16 (Cosechas UI — para reporte de producción)
**Estimación**: 3-4 horas
**Última revisión**: 2026-03-01

---

## Estado Real del Código (auditado 2026-03-01)

La data para todos los reportes YA EXISTE. Solo falta el mecanismo de exportación.

| Data necesaria                                        | Estado          |
| ----------------------------------------------------- | --------------- |
| ROI 4 años — `calcularROI()` en `roi.ts`              | ✅ Existe       |
| Métricas económicas — `calcularMetricasEconomicas()`  | ✅ Existe       |
| Proyección agua 12 meses — `agua-proyeccion-anual.ts` | ✅ Existe       |
| Consumo por zona — `calcularConsumoZona()`            | ✅ Existe       |
| Score calidad terreno — `calidad.ts`                  | ✅ Existe       |
| Cosechas reales vs proyectadas                        | ✅ Tras FASE_16 |
| Librería PDF                                          | ❌ NO instalada |

---

## Objetivo

Permitir al usuario exportar sus datos a PDF para imprimir, compartir con financistas (INDAP, bancos) o guardar como respaldo.

---

## Librería recomendada

**`@react-pdf/renderer`** — genera PDFs con componentes React, funciona client-side (sin servidor).

```bash
pnpm add @react-pdf/renderer
```

Alternativa más simple: **`html2pdf.js`** — convierte HTML a PDF directamente. Más fácil pero menos control.

---

## Tipos de reporte (priorizados)

### Reporte 1: Financiero (datos ya existen — más útil)

Contenido:

- Resumen del proyecto (nombre, terreno, área, cultivos)
- CAPEX inicial (inversión en plantas, infraestructura)
- OPEX anual (agua, fertilización, mano de obra estimada)
- Ingresos proyectados año 1 / 2 / 3 / 4
- ROI y payback (meses de recuperación)
- Punto de equilibrio en kg/año

Fuentes: `calcularROI()`, `calcularMetricasEconomicas()`

### Reporte 2: Agua (datos ya existen)

Contenido:

- Consumo mensual por zona (tabla + gráfico de barras)
- Costo del agua anual
- Proyección 12 meses (recargas, lavados, replantas)
- Estado de estanques

Fuentes: `calcularConsumoZona()`, `agua-proyeccion-anual.ts`

### Reporte 3: Producción (requiere FASE_16)

Contenido:

- Cosechas reales vs proyectadas por zona
- kg/m² y kg/planta
- Ingresos reales vs proyectados
- Gráfico kg/mes

Fuente: `cosechasDAL`, `calcularROI()`

### Reporte 4: Resumen Proyecto (compilación)

Contenido:

- Mapa del terreno (screenshot del canvas PixiJS)
- Zonas, cultivos, plantas (tabla resumen)
- Score de calidad del terreno
- Formato compatible con formularios INDAP

---

## Archivos a crear

| Archivo                              | Descripción                             |
| ------------------------------------ | --------------------------------------- |
| `src/lib/pdf/reporte-financiero.tsx` | Componente PDF del reporte financiero   |
| `src/lib/pdf/reporte-agua.tsx`       | Componente PDF del reporte de agua      |
| `src/lib/pdf/reporte-produccion.tsx` | Componente PDF de producción            |
| `src/app/reportes/page.tsx`          | Página con botones de descarga          |
| `src/app/reportes/error.tsx`         | Error boundary                          |
| `src/lib/constants/routes.ts`        | Agregar `ROUTES.REPORTES = "/reportes"` |

---

## Notas de implementación

- Los reportes se generan y descargan client-side — sin servidor, funciona offline
- Usar datos del terreno/proyecto activo del `ProjectContext`
- El screenshot del mapa PixiJS (Reporte 4) requiere `canvas.toDataURL()` — implementar si el mapa está montado
- Formato de fecha: `es-CL` (día/mes/año)
- Moneda: CLP con separador de miles
