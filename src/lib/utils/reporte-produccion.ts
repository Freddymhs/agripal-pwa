import type { Cosecha } from "@/types";
import type { ProyeccionROI } from "./roi";
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

export interface DatosReporteProduccion {
  terreno: {
    nombre: string;
  };
  produccionPorZona: Array<{
    zona: string;
    cultivo: string;
    kgReal: number;
    kgProyectado: number;
    pctLogrado: number;
    kgPorM2: number;
    ingresoReal: number;
    ingresoProyectado: number;
  }>;
  resumenMensual: Array<{
    mes: string;
    totalKg: number;
    totalCLP: number;
    registros: number;
  }>;
  distribucionCalidad: Array<{
    calidad: string;
    cantidad: number;
    kg: number;
    porcentaje: number;
  }>;
  cosechas: Cosecha[];
  rois: ProyeccionROI[];
}

// ─── Generador ──────────────────────────────────────────────────────

export function generarReporteProduccion(datos: DatosReporteProduccion): void {
  const doc = crearPDF();
  const fecha = getFechaReporte();

  // `let` justificado: cursor de posicion imperativo requerido por jsPDF.
  let y = renderEncabezadoReporte(
    doc,
    "Reporte de Produccion",
    datos.terreno.nombre,
    fecha,
  );

  // 1. Produccion real por zona
  y = titulo(doc, "1. Produccion Real por Zona", y);

  if (datos.produccionPorZona.length > 0) {
    const prodHeaders = [
      "Zona",
      "Cultivo",
      "kg real",
      "kg proy.",
      "% logrado",
      "kg/m2",
    ];
    const prodRows = datos.produccionPorZona.map((p) => [
      p.zona.slice(0, 16),
      p.cultivo.slice(0, 14),
      formatNumero(p.kgReal, 1),
      formatNumero(p.kgProyectado, 1),
      `${formatNumero(p.pctLogrado, 0)}%`,
      formatNumero(p.kgPorM2, 2),
    ]);

    const totalReal = datos.produccionPorZona.reduce((s, p) => s + p.kgReal, 0);
    const totalProy = datos.produccionPorZona.reduce(
      (s, p) => s + p.kgProyectado,
      0,
    );
    const pctTotal =
      totalProy > 0 ? Math.round((totalReal / totalProy) * 100) : 0;
    prodRows.push([
      "TOTAL",
      "",
      formatNumero(totalReal, 1),
      formatNumero(totalProy, 1),
      `${pctTotal}%`,
      "",
    ]);

    y = renderTabla(
      doc,
      {
        headers: prodHeaders,
        rows: prodRows,
        colWidths: [30, 28, 28, 28, 30, 36],
        colAligns: ["left", "left", "right", "right", "right", "right"],
      },
      y,
    );
  } else {
    y = textoNormal(doc, "Sin registros de produccion por zona.", y);
  }

  y = lineaSeparadora(doc, y);

  // 2. Ingresos reales vs proyectados
  y = verificarPagina(doc, y, 25);
  y = titulo(doc, "2. Ingresos Reales vs Proyectados", y);

  if (datos.produccionPorZona.length > 0) {
    const ingHeaders = ["Zona", "Ingreso real", "Ingreso proy.", "Diferencia"];
    const ingRows = datos.produccionPorZona.map((p) => {
      const diff = p.ingresoReal - p.ingresoProyectado;
      return [
        p.zona.slice(0, 20),
        formatCLPpdf(p.ingresoReal),
        formatCLPpdf(p.ingresoProyectado),
        `${diff >= 0 ? "+" : ""}${formatCLPpdf(diff)}`,
      ];
    });

    const totalIReal = datos.produccionPorZona.reduce(
      (s, p) => s + p.ingresoReal,
      0,
    );
    const totalIProy = datos.produccionPorZona.reduce(
      (s, p) => s + p.ingresoProyectado,
      0,
    );
    const totalDiff = totalIReal - totalIProy;
    ingRows.push([
      "TOTAL",
      formatCLPpdf(totalIReal),
      formatCLPpdf(totalIProy),
      `${totalDiff >= 0 ? "+" : ""}${formatCLPpdf(totalDiff)}`,
    ]);

    y = renderTabla(
      doc,
      {
        headers: ingHeaders,
        rows: ingRows,
        colWidths: [45, 45, 45, 45],
        colAligns: ["left", "right", "right", "right"],
      },
      y,
    );
  } else {
    y = textoNormal(doc, "Sin datos de ingresos.", y);
  }

  y = lineaSeparadora(doc, y);

  // 3. Resumen mensual
  y = verificarPagina(doc, y, 25);
  y = titulo(doc, "3. Resumen Mensual", y);

  if (datos.resumenMensual.length > 0) {
    const mesHeaders = ["Mes", "Total kg", "Total CLP", "Registros"];
    const mesRows = datos.resumenMensual.map((m) => [
      m.mes.slice(0, 16),
      formatNumero(m.totalKg, 1),
      formatCLPpdf(m.totalCLP),
      String(m.registros),
    ]);

    y = renderTabla(
      doc,
      {
        headers: mesHeaders,
        rows: mesRows,
        colWidths: [50, 40, 45, 45],
        colAligns: ["left", "right", "right", "right"],
      },
      y,
    );
  } else {
    y = textoNormal(doc, "Sin resumen mensual disponible.", y);
  }

  y = lineaSeparadora(doc, y);

  // 4. Distribucion por calidad
  y = verificarPagina(doc, y, 25);
  y = titulo(doc, "4. Distribucion por Calidad", y);

  if (datos.distribucionCalidad.length > 0) {
    const calHeaders = ["Calidad", "Registros", "kg", "% del total"];
    const calRows = datos.distribucionCalidad.map((d) => [
      `Grado ${d.calidad}`,
      String(d.cantidad),
      formatNumero(d.kg, 1),
      `${formatNumero(d.porcentaje, 1)}%`,
    ]);

    y = renderTabla(
      doc,
      {
        headers: calHeaders,
        rows: calRows,
        colWidths: [45, 45, 45, 45],
        colAligns: ["left", "right", "right", "right"],
      },
      y,
    );
  } else {
    y = textoNormal(doc, "Sin datos de calidad registrados.", y);
  }

  // Resumen final
  y += 2;
  y = lineaSeparadora(doc, y);
  y = verificarPagina(doc, y, 20);
  y = titulo(doc, "5. Resumen General", y);

  const totalKg = datos.cosechas.reduce((s, c) => s + c.cantidad_kg, 0);
  const totalIngreso = datos.cosechas
    .filter((c) => c.vendido && c.precio_venta_clp)
    .reduce((s, c) => s + (c.precio_venta_clp ?? 0), 0);

  y = parKV(
    doc,
    "Total cosechas registradas:",
    String(datos.cosechas.length),
    y,
  );
  y = parKV(doc, "Produccion total:", `${formatNumero(totalKg, 1)} kg`, y);
  parKV(doc, "Ingresos totales por venta:", formatCLPpdf(totalIngreso), y);

  renderPiePagina(doc, "Reporte de Produccion", fecha);
  guardarPDF(doc, "produccion", datos.terreno.nombre);
}
