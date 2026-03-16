import type { ProyeccionAnual } from "./agua-proyeccion-anual";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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

export interface DatosReporteAgua {
  terreno: {
    nombre: string;
    fuenteAgua: string;
  };
  consumoPorZona: Array<{
    zona: string;
    cultivo: string;
    plantas: number;
    m3Semana: number;
    m3Mes: number;
  }>;
  estanques: Array<{
    nombre: string;
    capacidadM3: number;
    nivelActualM3: number;
    pctLleno: number;
  }>;
  costoM3: number;
  proyeccion: ProyeccionAnual | null;
}

// ─── Generador ──────────────────────────────────────────────────────

export function generarReporteAgua(datos: DatosReporteAgua): void {
  const doc = crearPDF();
  const fecha = getFechaReporte();

  // `let` justificado: cursor de posicion imperativo requerido por jsPDF.
  let y = renderEncabezadoReporte(
    doc,
    "Reporte Hidrico",
    datos.terreno.nombre,
    fecha,
  );

  // 1. Consumo por zona
  y = titulo(doc, "1. Consumo por Zona", y);
  y = parKV(doc, "Fuente de agua:", datos.terreno.fuenteAgua, y);
  y += 2;

  if (datos.consumoPorZona.length > 0) {
    const consHeaders = ["Zona", "Cultivo", "Plantas", "m3/semana", "m3/mes"];
    const consRows = datos.consumoPorZona.map((c) => [
      c.zona.slice(0, 18),
      c.cultivo.slice(0, 15),
      String(c.plantas),
      formatNumero(c.m3Semana, 2),
      formatNumero(c.m3Mes, 1),
    ]);

    const totalSem = datos.consumoPorZona.reduce((s, c) => s + c.m3Semana, 0);
    const totalMes = datos.consumoPorZona.reduce((s, c) => s + c.m3Mes, 0);
    consRows.push([
      "TOTAL",
      "",
      "",
      formatNumero(totalSem, 2),
      formatNumero(totalMes, 1),
    ]);

    y = renderTabla(
      doc,
      {
        headers: consHeaders,
        rows: consRows,
        colWidths: [38, 32, 28, 40, 42],
        colAligns: ["left", "left", "right", "right", "right"],
      },
      y,
    );
  } else {
    y = textoNormal(doc, "Sin zonas de cultivo con consumo registrado.", y);
  }

  y = lineaSeparadora(doc, y);

  // 2. Estado de estanques
  y = verificarPagina(doc, y, 25);
  y = titulo(doc, "2. Estado de Estanques", y);

  if (datos.estanques.length > 0) {
    const estHeaders = ["Estanque", "Capacidad (m3)", "Nivel (m3)", "% lleno"];
    const estRows = datos.estanques.map((e) => [
      e.nombre.slice(0, 22),
      formatNumero(e.capacidadM3, 1),
      formatNumero(e.nivelActualM3, 1),
      `${e.pctLleno}%`,
    ]);

    y = renderTabla(
      doc,
      {
        headers: estHeaders,
        rows: estRows,
        colWidths: [50, 40, 40, 50],
        colAligns: ["left", "right", "right", "right"],
      },
      y,
    );
  } else {
    y = textoNormal(doc, "Sin estanques configurados.", y);
  }

  y = lineaSeparadora(doc, y);

  // 3. Costo anual del agua
  y = verificarPagina(doc, y, 20);
  y = titulo(doc, "3. Costo del Agua", y);

  const consumoMensualTotal = datos.consumoPorZona.reduce(
    (s, c) => s + c.m3Mes,
    0,
  );
  const consumoAnual = consumoMensualTotal * 12;
  const costoAnual = consumoAnual * datos.costoM3;

  y = parKV(doc, "Costo por m3:", formatCLPpdf(datos.costoM3), y);
  y = parKV(
    doc,
    "Consumo mensual:",
    `${formatNumero(consumoMensualTotal, 1)} m3`,
    y,
  );
  y = parKV(
    doc,
    "Consumo anual estimado:",
    `${formatNumero(consumoAnual, 0)} m3`,
    y,
  );
  y = parKV(doc, "Costo anual estimado:", formatCLPpdf(costoAnual), y);
  y += 2;
  y = lineaSeparadora(doc, y);

  // 4. Proyeccion 12 meses
  if (datos.proyeccion) {
    y = verificarPagina(doc, y, 30);
    y = titulo(doc, "4. Proyeccion 12 Meses", y);

    const proyHeaders = [
      "Mes",
      "Inicio (m3)",
      "Consumo",
      "Recargas",
      "Fin (m3)",
      "Deficit",
    ];
    const proyRows = datos.proyeccion.meses.map((m) => [
      m.mesNombre.slice(0, 14),
      formatNumero(m.nivelInicio, 1),
      formatNumero(m.consumo, 1),
      formatNumero(m.recargas, 1),
      formatNumero(m.nivelFin, 1),
      m.diasDeficit > 0 ? `${m.diasDeficit} dias` : "-",
    ]);

    y = renderTabla(
      doc,
      {
        headers: proyHeaders,
        rows: proyRows,
        colWidths: [32, 28, 28, 28, 28, 36],
        colAligns: ["left", "right", "right", "right", "right", "right"],
      },
      y,
    );

    y = lineaSeparadora(doc, y);

    // 5. Eventos programados
    const eventosLimitados = datos.proyeccion.eventos.slice(0, 20);
    if (eventosLimitados.length > 0) {
      y = verificarPagina(doc, y, 20);
      y = titulo(doc, "5. Eventos Programados", y);

      const evHeaders = ["Fecha", "Tipo", "Descripcion"];
      const evRows = eventosLimitados.map((e) => [
        format(e.fecha, "dd/MM/yyyy", { locale: es }),
        e.tipo,
        e.titulo.slice(0, 35),
      ]);

      y = renderTabla(
        doc,
        {
          headers: evHeaders,
          rows: evRows,
          colWidths: [40, 30, 110],
          colAligns: ["left", "left", "left"],
        },
        y,
      );

      y = lineaSeparadora(doc, y);
    }

    // 6. Resumen
    y = verificarPagina(doc, y, 25);
    const secResumen = eventosLimitados.length > 0 ? "6" : "5";
    y = titulo(doc, `${secResumen}. Resumen Anual`, y);

    const resumen = datos.proyeccion.resumen;
    y = parKV(
      doc,
      "Consumo total anual:",
      `${formatNumero(resumen.consumoTotalAnual, 0)} m3`,
      y,
    );
    y = parKV(
      doc,
      "Recargas totales:",
      `${formatNumero(resumen.recargasTotales, 0)} m3`,
      y,
    );
    y = parKV(doc, "Costo agua anual:", formatCLPpdf(resumen.costosAgua), y);
    y = parKV(doc, "Meses con deficit:", String(resumen.mesesDeficit), y);

    if (resumen.fechaPrimerDeficit) {
      parKV(
        doc,
        "Primer deficit:",
        format(resumen.fechaPrimerDeficit, "MMMM yyyy", { locale: es }),
        y,
      );
    }
  }

  renderPiePagina(doc, "Reporte Hidrico", fecha);
  guardarPDF(doc, "agua", datos.terreno.nombre);
}
