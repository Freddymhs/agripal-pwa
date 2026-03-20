import type { ProyeccionROI } from "./roi";
import type { MetricasEconomicas } from "./economia-avanzada";
import {
  crearPDF,
  guardarPDF,
  renderEncabezadoReporte,
  renderPiePagina,
  titulo,
  parKV,
  textoNormal,
  lineaSeparadora,
  verificarPagina,
  renderTabla,
  formatCLPpdf,
  formatNumero,
  getFechaReporte,
} from "./pdf-helpers";

// ─── Tipos ──────────────────────────────────────────────────────────

export interface DatosReporteFinanciero {
  terreno: {
    nombre: string;
    area_m2: number;
    ubicacion: string;
  };
  zonas: Array<{
    nombre: string;
    cultivo: string;
    numPlantas: number;
    costoUnitario: number;
    subtotal: number;
    costoAguaAnual: number;
  }>;
  rois: ProyeccionROI[];
  metricas: Array<{
    zona: string;
    metricas: MetricasEconomicas;
  }>;
}

// ─── Generador ──────────────────────────────────────────────────────

export function generarReporteFinanciero(datos: DatosReporteFinanciero): void {
  const doc = crearPDF();
  const fecha = getFechaReporte();

  // `let` justificado: cursor de posicion imperativo requerido por jsPDF.
  let y = renderEncabezadoReporte(
    doc,
    "Reporte Financiero",
    datos.terreno.nombre,
    fecha,
  );

  // 1. Resumen del proyecto
  y = titulo(doc, "1. Resumen del Proyecto", y);
  y = parKV(doc, "Terreno:", datos.terreno.nombre, y);
  y = parKV(
    doc,
    "Area total:",
    `${formatNumero(datos.terreno.area_m2, 0)} m2`,
    y,
  );
  y = parKV(doc, "Ubicacion:", datos.terreno.ubicacion, y);
  y = parKV(doc, "Zonas productivas:", String(datos.zonas.length), y);

  const totalPlantas = datos.zonas.reduce((s, z) => s + z.numPlantas, 0);
  y = parKV(doc, "Total plantas:", String(totalPlantas), y);
  y += 2;
  y = lineaSeparadora(doc, y);

  // 2. CAPEX — Inversion inicial por zona
  y = verificarPagina(doc, y, 30);
  y = titulo(doc, "2. Inversion Inicial (CAPEX)", y);

  const capexHeaders = ["Zona", "Cultivo", "Plantas", "$/planta", "Subtotal"];
  const capexRows = datos.zonas.map((z) => [
    z.nombre.slice(0, 18),
    z.cultivo.slice(0, 15),
    String(z.numPlantas),
    formatCLPpdf(z.costoUnitario),
    formatCLPpdf(z.subtotal),
  ]);

  const totalCapex = datos.zonas.reduce((s, z) => s + z.subtotal, 0);
  capexRows.push([
    "TOTAL",
    "",
    String(totalPlantas),
    "",
    formatCLPpdf(totalCapex),
  ]);

  y = renderTabla(
    doc,
    {
      headers: capexHeaders,
      rows: capexRows,
      colWidths: [38, 32, 28, 35, 47],
      colAligns: ["left", "left", "right", "right", "right"],
    },
    y,
  );

  y = lineaSeparadora(doc, y);

  // 3. OPEX — Costo anual de operacion
  y = verificarPagina(doc, y, 25);
  y = titulo(doc, "3. Costo Anual de Operacion (OPEX)", y);

  const opexHeaders = ["Zona", "Cultivo", "Costo agua/año"];
  const opexRows = datos.zonas.map((z) => [
    z.nombre.slice(0, 20),
    z.cultivo.slice(0, 18),
    formatCLPpdf(z.costoAguaAnual),
  ]);

  const totalOpex = datos.zonas.reduce((s, z) => s + z.costoAguaAnual, 0);
  opexRows.push(["TOTAL", "", formatCLPpdf(totalOpex)]);

  y = renderTabla(
    doc,
    {
      headers: opexHeaders,
      rows: opexRows,
      colWidths: [60, 60, 60],
      colAligns: ["left", "left", "right"],
    },
    y,
  );

  y = lineaSeparadora(doc, y);

  // 4. Proyeccion de ingresos (5 años)
  y = verificarPagina(doc, y, 30);
  y = titulo(doc, "4. Proyeccion de Ingresos (5 años)", y);

  if (datos.rois.length > 0) {
    const ingHeaders = ["Zona", "Año 1", "Año 2", "Año 3", "Año 4"];
    const ingRows = datos.rois.map((r) => [
      r.zona_nombre.slice(0, 18),
      "$ 0 (crecimiento)",
      formatCLPpdf(r.ingreso_año2),
      formatCLPpdf(r.ingreso_año3),
      formatCLPpdf(r.ingreso_año4),
    ]);

    // Totals row
    const t2 = datos.rois.reduce((s, r) => s + r.ingreso_año2, 0);
    const t3 = datos.rois.reduce((s, r) => s + r.ingreso_año3, 0);
    const t4 = datos.rois.reduce((s, r) => s + r.ingreso_año4, 0);
    ingRows.push([
      "TOTAL",
      "$ 0",
      formatCLPpdf(t2),
      formatCLPpdf(t3),
      formatCLPpdf(t4),
    ]);

    y = renderTabla(
      doc,
      {
        headers: ingHeaders,
        rows: ingRows,
        colWidths: [36, 36, 36, 36, 36],
        colAligns: ["left", "right", "right", "right", "right"],
      },
      y,
    );

    y = textoNormal(
      doc,
      "Nota: Año 1 es crecimiento vegetativo, sin produccion comercial.",
      y,
    );
    y += 2;
  } else {
    y = textoNormal(doc, "Sin datos de proyeccion disponibles.", y);
  }

  y = lineaSeparadora(doc, y);

  // 5. Indicadores de rentabilidad
  y = verificarPagina(doc, y, 30);
  y = titulo(doc, "5. Indicadores de Rentabilidad", y);

  if (datos.rois.length > 0) {
    const rentHeaders = ["Zona", "ROI 4 años", "Payback", "Viable"];
    const rentRows = datos.rois.map((r) => [
      r.zona_nombre.slice(0, 20),
      `${r.roi_5_años_pct}%`,
      r.punto_equilibrio_meses != null
        ? `${r.punto_equilibrio_meses} meses`
        : "N/A",
      r.viable ? "Si" : "No",
    ]);

    y = renderTabla(
      doc,
      {
        headers: rentHeaders,
        rows: rentRows,
        colWidths: [55, 40, 40, 45],
        colAligns: ["left", "right", "right", "center"],
      },
      y,
    );

    // Resumen global
    const invTotal = datos.rois.reduce((s, r) => s + r.inversion_total, 0);
    const ingAcum = datos.rois.reduce(
      (s, r) => s + r.ingreso_acumulado_5años,
      0,
    );
    const roiGlobal =
      invTotal > 0 ? Math.round(((ingAcum - invTotal) / invTotal) * 100) : 0;

    y = verificarPagina(doc, y, 20);
    y = textoNormal(doc, "Resumen consolidado:", y, true);
    y = parKV(doc, "Inversion total:", formatCLPpdf(invTotal), y);
    y = parKV(
      doc,
      "Ingreso neto acumulado (5 años):",
      formatCLPpdf(ingAcum),
      y,
    );
    y = parKV(doc, "ROI global:", `${roiGlobal}%`, y);
  } else {
    y = textoNormal(doc, "Sin datos de rentabilidad.", y);
  }

  // 6. Metricas avanzadas (si hay)
  if (datos.metricas.length > 0) {
    y += 2;
    y = lineaSeparadora(doc, y);
    y = verificarPagina(doc, y, 25);
    y = titulo(doc, "6. Metricas Avanzadas", y);

    const metHeaders = ["Zona", "Costo/kg", "Margen %", "Break-even kg"];
    const metRows = datos.metricas.map((m) => [
      m.zona.slice(0, 20),
      formatCLPpdf(m.metricas.costoProduccionKg),
      `${formatNumero(m.metricas.margenContribucion, 1)}%`,
      m.metricas.puntoEquilibrioKg != null
        ? `${formatNumero(m.metricas.puntoEquilibrioKg, 0)} kg`
        : "N/A",
    ]);

    renderTabla(
      doc,
      {
        headers: metHeaders,
        rows: metRows,
        colWidths: [50, 40, 40, 50],
        colAligns: ["left", "right", "right", "right"],
      },
      y,
    );
  }

  renderPiePagina(doc, "Reporte Financiero", fecha);
  guardarPDF(doc, "financiero", datos.terreno.nombre);
}
