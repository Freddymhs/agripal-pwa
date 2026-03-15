/** Umbrales de calidad de agua para riego agrícola (norma FAO / SAG Chile) */
export const UMBRALES_AGUA = {
  salinidad: { max: 2, unidad: "dS/m", alerta: "Agua salina" },
  boro: { max: 2, unidad: "ppm", alerta: "Tóxico para muchos cultivos" },
  arsenico: { max: 0.05, unidad: "mg/L", alerta: "Riesgo para salud" },
} as const;
