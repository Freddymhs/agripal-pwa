# 08: Predicción de Calidad de Fruto y ROI

**Status**: Completada
**Prioridad**: Media
**Dependencias**: 03-agua-por-zona, 04-fuentes-agua-calidad, 05-suelo-nutrientes, 06-clima-impacto-riego

---

## Problema

- No se puede predecir la calidad del fruto basándose en las condiciones actuales
- No hay cálculo de retorno de inversión (ROI) del proyecto
- El agricultor no puede evaluar si conviene invertir en agua + X cultivo

## Solución

### 8.1 Score de calidad de fruto

Basado en los datos que ya tenemos y los de fases anteriores:

```typescript
interface ScoreCalidad {
  cultivo_id: string;
  zona_id: string;

  // Factores (0-100 cada uno)
  score_agua: number; // calidad agua vs tolerancia cultivo
  score_suelo: number; // pH, salinidad, nutrientes vs requerimientos
  score_clima: number; // temp, humedad vs rango óptimo del cultivo
  score_riego: number; // agua disponible vs necesaria

  // Score total ponderado
  score_total: number; // 0-100
  categoria: "excelente" | "buena" | "aceptable" | "riesgosa" | "no_viable";

  // Recomendaciones
  factores_limitantes: string[]; // "Boro del agua excede tolerancia"
  mejoras_sugeridas: string[]; // "Considerar filtrado de agua"
}
```

### 8.2 Cálculo de ROI

```typescript
interface ProyeccionROI {
  cultivo_id: string;
  zona_id: string;

  // Inversión
  costo_plantas: number; // n_plantas × precio_planta
  costo_agua_anual: number; // consumo_anual × costo_m3
  costo_preparacion_suelo: number;
  costo_infraestructura: number; // estanque, riego, etc.
  inversion_total: number;

  // Producción (desde CatalogoCultivo.produccion)
  kg_esperados_año2: number;
  kg_esperados_año3: number;
  kg_esperados_año4: number;

  // Ingreso
  precio_kg_estimado: number; // promedio min/max del catálogo
  ingreso_año2: number;
  ingreso_año3: number;
  ingreso_año4: number;

  // ROI
  punto_equilibrio_meses: number;
  roi_3_años_pct: number;
  viable: boolean;
}
```

### 8.3 UI

- Nueva sección en panel de zona de cultivo: "Proyección"
- Dashboard de terreno: ROI global del terreno
- Comparador: "¿Qué pasa si planto Olivo vs Tuna en esta zona?"

## Datos estáticos disponibles

- `CatalogoCultivo.produccion` — kg/ha/año por año 2, 3, 4
- `CatalogoCultivo.precio_kg_min_clp/max_clp` — precios de venta
- `CatalogoCultivo.vida_util_años` — vida productiva
- `CatalogoCultivo.tiempo_produccion_meses` — tiempo hasta primera cosecha
- `CatalogoCultivo.tier` y `riesgo` — clasificación de viabilidad
- `CatalogoCultivo.viabilidad_proyecto` — ya calculada

## Archivos a crear/modificar

- `src/lib/utils/calidad.ts` — cálculo de score de calidad
- `src/lib/utils/roi.ts` — cálculo de ROI y proyección
- `src/components/proyeccion/score-calidad.tsx` — visualización de score
- `src/components/proyeccion/roi-panel.tsx` — panel de ROI
- `src/components/proyeccion/comparador.tsx` — comparar cultivos
