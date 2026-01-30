# ROI: dudas y mejora propuesta

Contexto actual (implementado en `src/lib/utils/roi.ts`):
- Costo de agua anual = `((agua_min + agua_max)/2 m³/ha/año) * (area_m2/10.000) * costo_m3`.
- Producción e ingresos se escalan por plantas reales (`numPlantas` vs plantasPorHa), pero el costo de agua no se reduce si hay menos plantas; toma toda el área de la zona.
- No usa consumo real por planta, no usa recargas del estanque ni horarios; el volumen del estanque no afecta al ROI.
- Precio de venta = promedio de min/max del cultivo. Precio planta = 50% de ese precio.
- ROI 4 años ≈ `(ingreso neto años 2-4 - costo plantas) / (costo plantas + costo agua)` * 100. Cada año se resta `costoAguaAnual` a los ingresos.

Problema observado:
- En zonas grandes con pocas plantas y/o con costo_m3 alto (ej. agua desalinizada), el costo de agua domina porque se calcula por área completa, no por consumo real. Resultado: ROI muy negativo aunque el panel de consumo semanal muestre poco gasto.

Mejora sugerida (más realista y coherente con el card de consumo semanal):
- Cambiar el cálculo de costo de agua a consumo real por planta:
  - `consumoSemanalZona` ya existe (se usa en el widget de “Consumo de agua”).
  - Nuevo costo anual: `consumoSemanalZona * 52 * costo_m3`.
- Así el costo de agua dependería de plantas vivas, su Kc y temporada, no del área total.

Notas:
- “Sin asignar” usa `agua_costo_clp_por_m3` del terreno. Si es 0, el agua queda gratis.
- Fuentes con costo 0 (Río Azapa/Lluta) inflan el ROI porque el denominador queda muy pequeño.
