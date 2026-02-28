# Futuro: Reportes y Estadisticas

**Prioridad:** Post-MVP (Tier 4)
**Dependencias:** Registro Cosechas (UI), datos existentes
**Feedback relacionado:** FEAT-F07 (exportar datos/reportes)

---

## Estado Actual del Codebase

**Ya existe la data para generar reportes:**

- `/economia` - ROI por cultivo/zona, inversion, costos agua, ingresos proyectados
- `/economia/avanzado` - Costo/kg, punto equilibrio, margen, payback
- `/escenarios` - Comparacion multi-cultivo
- `/agua/planificador` - Proyeccion 12 meses agua
- `calcularROI()` en `roi.ts` - Proyeccion 4 anos
- `calcularMetricasEconomicas()` en `economia-avanzada.ts`

**Falta:** Exportar esta data como PDF/Excel/CSV.

---

## Tipos de Reportes (priorizados)

### Tier 1: Reporte Financiero (datos ya existen)

- [ ] CAPEX/OPEX desde `calcularROI()`
- [ ] Ingresos vs gastos proyectados
- [ ] ROI a 4 anos con grafico
- [ ] Exportar a PDF

### Tier 2: Reporte de Agua (datos ya existen)

- [ ] Consumo mensual desde `calcularConsumoZona()`
- [ ] Costo agua anual
- [ ] Proyeccion 12 meses desde `agua-proyeccion-anual.ts`
- [ ] Exportar a PDF

### Tier 3: Reporte de Produccion (requiere UI cosechas)

- [ ] kg por cultivo real vs proyectado
- [ ] Ingresos por venta
- [ ] Rendimiento por m2
- [ ] Exportar a PDF/Excel

### Tier 4: Resumen Proyecto (compilacion)

- [ ] Area total, zonas, plantas
- [ ] Score calidad terreno (desde `calidad.ts`)
- [ ] Formato compatible INDAP

---

## Formatos de Exportacion

- **PDF**: Para imprimir/enviar (usar html2pdf o similar)
- **Excel**: Para analisis detallado (usar xlsx library)
- **CSV**: Para importar a otros sistemas
