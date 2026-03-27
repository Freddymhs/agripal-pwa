import { jsPDF } from "jspdf";
import { getCurrentTimestamp } from "@/lib/utils";

// ─── Constantes compartidas ─────────────────────────────────────────

export const MARGEN = 15;
export const ANCHO_UTIL = 210 - MARGEN * 2;
export const COLOR = {
  titulo: [17, 24, 39] as const,
  subtitulo: [37, 99, 235] as const,
  texto: [55, 65, 81] as const,
  gris: [107, 114, 128] as const,
  linea: [229, 231, 235] as const,
  headerBg: [243, 244, 246] as const,
};

// ─── Primitivas de renderizado ──────────────────────────────────────

export function lineaSeparadora(doc: jsPDF, y: number): number {
  doc.setDrawColor(...COLOR.linea);
  doc.setLineWidth(0.3);
  doc.line(MARGEN, y, 210 - MARGEN, y);
  return y + 4;
}

export function titulo(doc: jsPDF, texto: string, y: number): number {
  doc.setFontSize(14);
  doc.setTextColor(...COLOR.subtitulo);
  doc.setFont("helvetica", "bold");
  doc.text(texto, MARGEN, y);
  return y + 7;
}

export function textoNormal(
  doc: jsPDF,
  texto: string,
  y: number,
  negrita = false,
): number {
  doc.setFontSize(9);
  doc.setTextColor(...COLOR.texto);
  doc.setFont("helvetica", negrita ? "bold" : "normal");
  doc.text(texto, MARGEN, y);
  return y + 4.5;
}

export function parKV(
  doc: jsPDF,
  clave: string,
  valor: string,
  y: number,
  x = MARGEN,
): number {
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR.gris);
  doc.text(clave, x, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLOR.texto);
  doc.text(valor, x + doc.getTextWidth(clave) + 2, y);
  return y + 4.5;
}

export function verificarPagina(
  doc: jsPDF,
  y: number,
  espacioNecesario = 20,
): number {
  if (y + espacioNecesario > 280) {
    doc.addPage();
    return 20;
  }
  return y;
}

export function renderPiePagina(
  doc: jsPDF,
  tituloReporte: string,
  fecha: string,
): void {
  const totalPaginas = doc.getNumberOfPages();
  Array.from({ length: totalPaginas }, (_, idx) => idx + 1).forEach(
    (pagina) => {
      doc.setPage(pagina);
      doc.setFontSize(7);
      doc.setTextColor(...COLOR.gris);
      doc.text(`AgriPlan — ${tituloReporte} — ${fecha}`, MARGEN, 290);
      doc.text(`Pagina ${pagina}/${totalPaginas}`, 210 - MARGEN, 290, {
        align: "right",
      });
    },
  );
}

// ─── Encabezado reutilizable para reportes ──────────────────────────

export function renderEncabezadoReporte(
  doc: jsPDF,
  tituloReporte: string,
  terreno: string,
  fecha: string,
): number {
  doc.setFontSize(18);
  doc.setTextColor(...COLOR.titulo);
  doc.setFont("helvetica", "bold");
  doc.text(tituloReporte, MARGEN, 20);

  doc.setFontSize(10);
  doc.setTextColor(...COLOR.gris);
  doc.setFont("helvetica", "normal");
  doc.text(`Terreno: ${terreno}`, MARGEN, 27);
  doc.text(`Generado: ${fecha}`, 210 - MARGEN, 27, { align: "right" });

  return lineaSeparadora(doc, 33);
}

// ─── Tabla con headers estilizados y filas alternadas ───────────────

export interface TablaConfig {
  headers: string[];
  rows: string[][];
  colWidths?: number[];
  colAligns?: ("left" | "right" | "center")[];
}

export function renderTabla(
  doc: jsPDF,
  config: TablaConfig,
  y: number,
): number {
  const { headers, rows, colAligns } = config;

  const colWidths =
    config.colWidths ??
    headers.map(() => Math.floor(ANCHO_UTIL / headers.length));

  // Header row
  y = verificarPagina(doc, y, 12);
  doc.setFillColor(...COLOR.headerBg);
  doc.rect(MARGEN, y - 3.5, ANCHO_UTIL, 5.5, "F");

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR.titulo);

  headers.reduce((xPos, header, i) => {
    const align = colAligns?.[i] ?? "left";
    const textX =
      align === "right"
        ? xPos + colWidths[i] - 1
        : align === "center"
          ? xPos + colWidths[i] / 2
          : xPos + 1;
    doc.text(header, textX, y, { align });
    return xPos + colWidths[i];
  }, MARGEN);
  y += 3;
  y = lineaSeparadora(doc, y);

  // Data rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);

  rows.forEach((row, rowIdx) => {
    y = verificarPagina(doc, y, 5.5);

    // Alternating row background
    if (rowIdx % 2 === 1) {
      doc.setFillColor(249, 250, 251);
      doc.rect(MARGEN, y - 3.5, ANCHO_UTIL, 5, "F");
    }

    doc.setTextColor(...COLOR.texto);
    row.reduce((xPos, cell, i) => {
      const align = colAligns?.[i] ?? "left";
      const textX =
        align === "right"
          ? xPos + colWidths[i] - 1
          : align === "center"
            ? xPos + colWidths[i] / 2
            : xPos + 1;
      const cellText = (cell ?? "").slice(0, 30);
      doc.text(cellText, textX, y, { align });
      return xPos + colWidths[i];
    }, MARGEN);
    y += 4.5;
  });

  return y + 2;
}

// ─── Factory y utilidades ───────────────────────────────────────────

export function crearPDF(): jsPDF {
  return new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
}

export function guardarPDF(doc: jsPDF, prefix: string, nombre: string): void {
  const slug = nombre.replace(/\s+/g, "-").toLowerCase();
  const fecha = getCurrentTimestamp().slice(0, 10);
  doc.save(`${prefix}-${slug}-${fecha}.pdf`);
}

export function formatCLPpdf(n: number): string {
  return "$ " + Math.round(n).toLocaleString("es-CL");
}

export function formatNumero(n: number, decimales = 1): string {
  return n.toLocaleString("es-CL", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

export function getFechaReporte(): string {
  return new Date().toLocaleDateString("es-CL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
