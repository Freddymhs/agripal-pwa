import { jsPDF } from "jspdf";
import { getCurrentTimestamp } from "@/lib/utils";
import type {
  Terreno,
  Zona,
  CatalogoCultivo,
  Planta,
  Alerta,
  EtapaCrecimiento,
} from "@/types";
import type { DatosClimaticos } from "@/lib/data/calculos-clima";
import { evaluarSuelo, NIVEL_ALERTA } from "@/lib/data/umbrales-suelo";
import { getKc } from "@/lib/data/coeficientes-kc";
import { UBICACION_PILOTO } from "@/lib/constants/conversiones";
import {
  ESTADO_ALERTA,
  SEVERIDAD_ALERTA,
  ETAPA,
  ETAPAS_LIST,
} from "@/lib/constants/entities";
import { logger } from "@/lib/logger";
import {
  MARGEN,
  ANCHO_UTIL,
  COLOR,
  lineaSeparadora,
  titulo,
  textoNormal,
  parKV,
  verificarPagina,
  renderPiePagina as renderPiePaginaShared,
} from "@/lib/utils/pdf-helpers";

// ─── Tipos del informe ─────────────────────────────────────────────

export interface DatosInforme {
  terreno: Terreno;
  zonas: Zona[];
  plantas: Planta[];
  catalogoCultivos: CatalogoCultivo[];
  alertas: Alerta[];
  mapaImageDataUrl: string;
  clima: DatosClimaticos;
  suelo?: Terreno["suelo"];
}

interface ResumenTerreno {
  nombre: string;
  dimensiones: string;
  areaTotalM2: number;
  areaUsadaM2: number;
  areaLibreM2: number;
  pctUso: number;
  coordenadas: string;
  altitudM: number;
  region: string;
}

interface ResumenZona {
  nombre: string;
  tipo: string;
  dimensiones: string;
  areaM2: number;
  cantPlantas: number;
  estanque?: { capacidadM3: number; nivelActualM3: number; pctLleno: number };
}

interface ResumenCultivo {
  nombre: string;
  cantPlantas: number;
  espaciadoM: number;
  aguaRango: string;
  kc: Record<EtapaCrecimiento, number>;
  phRango: string;
}

interface DatosInformeProcessed {
  fecha: string;
  terreno: ResumenTerreno;
  zonas: ResumenZona[];
  suelo: {
    evaluacion: ReturnType<typeof evaluarSuelo>;
    datosRaw: Terreno["suelo"];
  };
  agua: {
    fuente: string;
    disponibleM3: number;
    actualM3: number;
    salinidadDsM?: number;
    boroPpm?: number;
    estanques: ResumenZona[];
    dgaM3Mes?: number;
  };
  clima: DatosClimaticos;
  cultivos: ResumenCultivo[];
  alertasActivas: Alerta[];
  mapaImageDataUrl: string;
}

// ─── Paso 1: Extraer y transformar datos (puro, sin side effects) ──

function calcularAreaUsada(zonas: Zona[]): number {
  return zonas.reduce((acc, z) => acc + (z.area_m2 ?? 0), 0);
}

function procesarDatos(datos: DatosInforme): DatosInformeProcessed {
  const {
    terreno,
    zonas,
    plantas,
    catalogoCultivos,
    alertas,
    mapaImageDataUrl,
  } = datos;

  const areaUsadaM2 = calcularAreaUsada(zonas);
  const areaLibreM2 = terreno.area_m2 - areaUsadaM2;
  const pctUso =
    terreno.area_m2 > 0 ? Math.round((areaUsadaM2 / terreno.area_m2) * 100) : 0;

  const resumenTerreno: ResumenTerreno = {
    nombre: terreno.nombre,
    dimensiones: `${terreno.ancho_m}m × ${terreno.alto_m}m`,
    areaTotalM2: terreno.area_m2,
    areaUsadaM2,
    areaLibreM2,
    pctUso,
    coordenadas: terreno.ubicacion?.coordenadas ?? UBICACION_PILOTO.coordenadas,
    altitudM: UBICACION_PILOTO.altitud_m,
    region: terreno.ubicacion?.region
      ? `${terreno.ubicacion.region}${terreno.ubicacion.comuna ? `, ${terreno.ubicacion.comuna}` : ""}`
      : UBICACION_PILOTO.region,
  };

  const resumenZonas: ResumenZona[] = zonas.map((z) => {
    const cantPlantas = plantas.filter((p) => p.zona_id === z.id).length;
    const base: ResumenZona = {
      nombre: z.nombre,
      tipo: z.tipo,
      dimensiones: `${z.ancho}×${z.alto}m`,
      areaM2: z.area_m2,
      cantPlantas,
    };
    if (z.estanque_config) {
      const cfg = z.estanque_config;
      base.estanque = {
        capacidadM3: cfg.capacidad_m3,
        nivelActualM3: cfg.nivel_actual_m3,
        pctLleno:
          cfg.capacidad_m3 > 0
            ? Math.round((cfg.nivel_actual_m3 / cfg.capacidad_m3) * 100)
            : 0,
      };
    }
    return base;
  });

  const cultivosEnUso = new Set(plantas.map((p) => p.tipo_cultivo_id));
  const resumenCultivos: ResumenCultivo[] = catalogoCultivos
    .filter((c) => cultivosEnUso.has(c.id))
    .map((cultivo) => {
      const cantPlantas = plantas.filter(
        (p) => p.tipo_cultivo_id === cultivo.id,
      ).length;
      const kc = Object.fromEntries(
        ETAPAS_LIST.map((e) => [e, getKc(cultivo, e)]),
      ) as Record<EtapaCrecimiento, number>;

      return {
        nombre: cultivo.nombre,
        cantPlantas,
        espaciadoM: cultivo.espaciado_recomendado_m,
        aguaRango: `${cultivo.agua_m3_ha_año_min}–${cultivo.agua_m3_ha_año_max} m³/ha/año`,
        kc,
        phRango: `${cultivo.ph_min}–${cultivo.ph_max}`,
      };
    });

  const estanques = resumenZonas.filter((z) => z.estanque);
  const dga = terreno.agua_avanzada?.derechos;

  const sueloFinal = datos.suelo ?? terreno.suelo;

  return {
    fecha: new Date().toLocaleDateString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    terreno: resumenTerreno,
    zonas: resumenZonas,
    suelo: {
      evaluacion: evaluarSuelo(sueloFinal),
      datosRaw: sueloFinal,
    },
    agua: {
      fuente: terreno.agua_fuente ?? "No especificada",
      disponibleM3: terreno.agua_disponible_m3 ?? 0,
      actualM3: terreno.agua_actual_m3 ?? 0,
      salinidadDsM: terreno.agua_calidad_salinidad_dS_m,
      boroPpm: terreno.agua_calidad_boro_ppm,
      estanques,
      dgaM3Mes: dga?.tiene_derechos_dga ? dga.m3_mes_autorizado : undefined,
    },
    clima: datos.clima,
    cultivos: resumenCultivos,
    alertasActivas: alertas.filter((a) => a.estado === ESTADO_ALERTA.ACTIVA),
    mapaImageDataUrl,
  };
}

// ─── Paso 2: Renderizado PDF (solo presentación) ───────────────────
// Primitivas (lineaSeparadora, titulo, textoNormal, parKV, verificarPagina)
// y constantes (MARGEN, ANCHO_UTIL, COLOR) importadas desde pdf-helpers.ts

function renderEncabezado(doc: jsPDF, fecha: string): number {
  doc.setFontSize(20);
  doc.setTextColor(...COLOR.titulo);
  doc.setFont("helvetica", "bold");
  doc.text("Informe Tecnico del Terreno", MARGEN, 20);

  doc.setFontSize(10);
  doc.setTextColor(...COLOR.gris);
  doc.setFont("helvetica", "normal");
  doc.text(`Generado: ${fecha}`, MARGEN, 27);
  doc.text("AgriPlan — Planificacion Agricola Inteligente", 210 - MARGEN, 27, {
    align: "right",
  });

  return lineaSeparadora(doc, 33);
}

function renderTerreno(doc: jsPDF, t: ResumenTerreno, y: number): number {
  y = titulo(doc, "1. Datos del Terreno", y);
  y = parKV(doc, "Nombre:", t.nombre, y);
  y = parKV(doc, "Dimensiones:", t.dimensiones, y);
  y = parKV(doc, "Area total:", `${t.areaTotalM2} m²`, y);
  y = parKV(doc, "Area usada:", `${t.areaUsadaM2} m² (${t.pctUso}%)`, y);
  y = parKV(doc, "Area libre:", `${t.areaLibreM2} m²`, y);
  y = parKV(doc, "Coordenadas:", t.coordenadas, y);
  y = parKV(doc, "Altitud:", `${t.altitudM} m.s.n.m.`, y);
  y = parKV(doc, "Region:", t.region, y);
  y += 2;
  return lineaSeparadora(doc, y);
}

function renderPlano(
  doc: jsPDF,
  dataUrl: string,
  terreno: ResumenTerreno,
  y: number,
): number {
  y = titulo(doc, "2. Plano del Terreno (con cotas)", y);

  if (dataUrl) {
    const imgAncho = ANCHO_UTIL;
    const rawAlto =
      terreno.areaTotalM2 > 0
        ? (Math.sqrt(terreno.areaTotalM2) /
            (terreno.areaTotalM2 / Math.sqrt(terreno.areaTotalM2))) *
          imgAncho
        : imgAncho * 0.6;
    const altoFinal = Math.min(rawAlto, 100);

    y = verificarPagina(doc, y, altoFinal + 10);
    doc.addImage(dataUrl, "PNG", MARGEN, y, imgAncho, altoFinal);
    y += altoFinal + 3;

    doc.setFontSize(7);
    doc.setTextColor(...COLOR.gris);
    doc.text("Escala aproximada — las medidas en metros son reales", MARGEN, y);
    y += 5;
  }

  return lineaSeparadora(doc, y);
}

function renderZonas(doc: jsPDF, zonas: ResumenZona[], y: number): number {
  y = verificarPagina(doc, y, 30);
  y = titulo(doc, "3. Zonas del Terreno", y);

  const colX = [MARGEN, MARGEN + 40, MARGEN + 75, MARGEN + 100, MARGEN + 130];
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR.titulo);
  doc.text("Nombre", colX[0], y);
  doc.text("Tipo", colX[1], y);
  doc.text("Dimensiones", colX[2], y);
  doc.text("Area (m²)", colX[3], y);
  doc.text("Plantas", colX[4], y);
  y += 1.5;
  y = lineaSeparadora(doc, y);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLOR.texto);

  for (const zona of zonas) {
    y = verificarPagina(doc, y, 6);
    doc.setFontSize(8);
    doc.text(zona.nombre.slice(0, 20), colX[0], y);
    doc.text(zona.tipo, colX[1], y);
    doc.text(zona.dimensiones, colX[2], y);
    doc.text(String(zona.areaM2), colX[3], y);
    doc.text(String(zona.cantPlantas), colX[4], y);
    y += 4.5;
  }

  y += 2;
  return lineaSeparadora(doc, y);
}

function renderSuelo(
  doc: jsPDF,
  suelo: DatosInformeProcessed["suelo"],
  y: number,
): number {
  y = verificarPagina(doc, y, 30);
  y = titulo(doc, "4. Analisis de Suelo", y);

  const { evaluacion, datosRaw } = suelo;

  if (datosRaw?.quimico?.analisis_realizado) {
    const q = datosRaw.quimico;
    y = parKV(doc, "Laboratorio:", q.laboratorio ?? "No especificado", y);
    y = parKV(doc, "Fecha:", q.fecha_analisis ?? "No registrada", y);
  } else {
    y = textoNormal(
      doc,
      "Sin analisis quimico de laboratorio — se usan valores por defecto de pampa Azapa.",
      y,
    );
  }

  if (evaluacion.problemas.length > 0) {
    for (const p of evaluacion.problemas) {
      y = verificarPagina(doc, y, 6);
      y = textoNormal(doc, `⚠ ${p}`, y);
    }
  }
  if (evaluacion.advertencias.length > 0) {
    for (const a of evaluacion.advertencias) {
      y = verificarPagina(doc, y, 6);
      y = textoNormal(doc, `! ${a}`, y);
    }
  }
  if (evaluacion.nivel === NIVEL_ALERTA.OK) {
    y = textoNormal(doc, "Suelo dentro de parametros aceptables.", y);
  }

  const fisico = datosRaw?.fisico;
  if (fisico) {
    if (fisico.ph !== undefined) y = parKV(doc, "pH:", String(fisico.ph), y);
    if (fisico.textura) y = parKV(doc, "Textura:", fisico.textura, y);
    if (fisico.drenaje) y = parKV(doc, "Drenaje:", fisico.drenaje, y);
    if (fisico.profundidad_efectiva_cm)
      y = parKV(doc, "Profundidad:", `${fisico.profundidad_efectiva_cm} cm`, y);
  }

  y += 2;
  return lineaSeparadora(doc, y);
}

function renderAgua(
  doc: jsPDF,
  agua: DatosInformeProcessed["agua"],
  y: number,
): number {
  y = verificarPagina(doc, y, 30);
  y = titulo(doc, "5. Recurso Hidrico", y);

  y = parKV(doc, "Fuente:", agua.fuente, y);
  y = parKV(doc, "Disponible:", `${agua.disponibleM3} m³`, y);
  y = parKV(doc, "Actual:", `${agua.actualM3} m³`, y);
  if (agua.salinidadDsM !== undefined)
    y = parKV(doc, "Salinidad agua:", `${agua.salinidadDsM} dS/m`, y);
  if (agua.boroPpm !== undefined)
    y = parKV(doc, "Boro agua:", `${agua.boroPpm} ppm`, y);

  if (agua.estanques.length > 0) {
    y += 2;
    y = textoNormal(doc, `Estanques (${agua.estanques.length}):`, y, true);
    for (const est of agua.estanques) {
      const e = est.estanque!;
      y = parKV(
        doc,
        `  ${est.nombre}:`,
        `${e.nivelActualM3}/${e.capacidadM3} m³ (${e.pctLleno}%)`,
        y,
      );
    }
  }

  if (agua.dgaM3Mes !== undefined) {
    y += 1;
    y = parKV(doc, "DGA:", `${agua.dgaM3Mes} m³/mes autorizado`, y);
  }

  y += 2;
  return lineaSeparadora(doc, y);
}

function renderClima(doc: jsPDF, clima: DatosClimaticos, y: number): number {
  y = verificarPagina(doc, y, 25);
  y = titulo(doc, `6. Clima (${clima.region}, ${clima.zona})`, y);

  y = parKV(
    doc,
    "Temp:",
    `${clima.temperatura.minima_historica_c}°C min — ${clima.temperatura.maxima_verano_c}°C max — ${clima.temperatura.promedio_anual_c}°C promedio`,
    y,
  );
  y = parKV(
    doc,
    "ET₀ anual:",
    `${clima.evapotranspiracion.et0_mm_dia} mm/dia promedio`,
    y,
  );
  y = parKV(doc, "Lluvia:", `${clima.lluvia.anual_mm} mm/año`, y);
  y = parKV(
    doc,
    "Viento:",
    `${clima.viento.max_kmh} km/h max, dir ${clima.viento.direccion_predominante}`,
    y,
  );

  y += 2;
  return lineaSeparadora(doc, y);
}

function renderCultivos(
  doc: jsPDF,
  cultivos: ResumenCultivo[],
  y: number,
): number {
  y = verificarPagina(doc, y, 30);
  y = titulo(doc, "7. Cultivos y Coeficientes (Kc)", y);

  if (cultivos.length === 0) {
    y = textoNormal(doc, "No hay cultivos plantados actualmente.", y);
  } else {
    for (const c of cultivos) {
      y = verificarPagina(doc, y, 15);
      y = textoNormal(doc, `${c.nombre} (${c.cantPlantas} plantas)`, y, true);
      y = parKV(doc, "  Espaciado:", `${c.espaciadoM}m`, y);
      y = parKV(doc, "  Agua:", c.aguaRango, y);
      y = parKV(
        doc,
        "  Kc:",
        `plantula=${c.kc[ETAPA.PLANTULA]} joven=${c.kc[ETAPA.JOVEN]} adulta=${c.kc[ETAPA.ADULTA]} madura=${c.kc[ETAPA.MADURA]}`,
        y,
      );
      y = parKV(doc, "  pH:", c.phRango, y);
      y += 1;
    }
  }

  return lineaSeparadora(doc, y);
}

function renderAlertas(doc: jsPDF, alertas: Alerta[], y: number): number {
  y = verificarPagina(doc, y, 20);
  y = titulo(doc, "8. Alertas Activas", y);

  if (alertas.length === 0) {
    y = textoNormal(doc, "Sin alertas activas.", y);
  } else {
    for (const alerta of alertas.slice(0, 10)) {
      y = verificarPagina(doc, y, 8);
      const icono =
        alerta.severidad === SEVERIDAD_ALERTA.CRITICAL
          ? "⚠"
          : alerta.severidad === SEVERIDAD_ALERTA.WARNING
            ? "!"
            : "i";
      y = textoNormal(doc, `[${icono}] ${alerta.titulo}`, y);
      if (alerta.sugerencia) {
        y = parKV(doc, "  →", alerta.sugerencia, y);
      }
    }
  }
  return y;
}

function renderPiePagina(doc: jsPDF, fecha: string): void {
  renderPiePaginaShared(doc, "Informe Tecnico", fecha);
}

// ─── API pública ────────────────────────────────────────────────────

export function generarInformePDF(datos: DatosInforme): void {
  const d = procesarDatos(datos);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Pipeline secuencial: cada sección recibe la posición Y y retorna la siguiente.
  // `let` justificado: cursor de posición imperativo requerido por jsPDF.

  let y = renderEncabezado(doc, d.fecha);
  y = renderTerreno(doc, d.terreno, y);
  y = renderPlano(doc, d.mapaImageDataUrl, d.terreno, y);
  y = renderZonas(doc, d.zonas, y);
  y = renderSuelo(doc, d.suelo, y);
  y = renderAgua(doc, d.agua, y);
  y = renderClima(doc, d.clima, y);
  y = renderCultivos(doc, d.cultivos, y);
  renderAlertas(doc, d.alertasActivas, y);

  renderPiePagina(doc, d.fecha);

  const nombreArchivo = `informe-${d.terreno.nombre.replace(/\s+/g, "-").toLowerCase()}-${getCurrentTimestamp().slice(0, 10)}.pdf`;
  doc.save(nombreArchivo);
}

export function generarPaqueteIA(
  datos: Omit<DatosInforme, "mapaImageDataUrl">,
): string {
  const d = procesarDatos({ ...datos, mapaImageDataUrl: "" });

  const paquete = {
    instruccion:
      "Analiza este terreno agricola y sugiere mejoras en la distribucion de zonas, uso del espacio, y optimizacion de recursos.",
    terreno: {
      nombre: d.terreno.nombre,
      dimensiones: d.terreno.dimensiones,
      area_total_m2: d.terreno.areaTotalM2,
      area_usada_m2: d.terreno.areaUsadaM2,
      coordenadas: d.terreno.coordenadas,
      altitud_m: d.terreno.altitudM,
      region: d.terreno.region,
    },
    clima: {
      et0_promedio_mm_dia: d.clima.evapotranspiracion.et0_mm_dia,
      temp_min_c: d.clima.temperatura.minima_historica_c,
      temp_max_c: d.clima.temperatura.maxima_verano_c,
      temp_promedio_c: d.clima.temperatura.promedio_anual_c,
      lluvia_anual_mm: d.clima.lluvia.anual_mm,
      viento_max_km_h: d.clima.viento.max_kmh,
      viento_direccion: d.clima.viento.direccion_predominante,
    },
    suelo: {
      evaluacion: d.suelo.evaluacion.nivel,
      problemas: d.suelo.evaluacion.problemas,
      advertencias: d.suelo.evaluacion.advertencias,
      ph: d.suelo.datosRaw?.fisico?.ph,
      textura: d.suelo.datosRaw?.fisico?.textura,
      salinidad_dS_m: d.suelo.datosRaw?.quimico?.salinidad_dS_m,
      boro_mg_l: d.suelo.datosRaw?.quimico?.boro_mg_l,
      arsenico_mg_l: d.suelo.datosRaw?.quimico?.arsenico_mg_l,
    },
    agua: {
      fuente: d.agua.fuente,
      disponible_m3: d.agua.disponibleM3,
      actual_m3: d.agua.actualM3,
      salinidad_dS_m: d.agua.salinidadDsM,
      boro_ppm: d.agua.boroPpm,
    },
    zonas: d.zonas.map((z) => ({
      nombre: z.nombre,
      tipo: z.tipo,
      dimensiones: z.dimensiones,
      area_m2: z.areaM2,
      plantas: z.cantPlantas,
      ...(z.estanque ? { estanque: z.estanque } : {}),
    })),
    cultivos: d.cultivos.map((c) => ({
      nombre: c.nombre,
      plantas: c.cantPlantas,
      espaciado_m: c.espaciadoM,
      agua: c.aguaRango,
      kc: c.kc,
      ph: c.phRango,
    })),
    alertas_activas: d.alertasActivas.map((a) => ({
      tipo: a.tipo,
      severidad: a.severidad,
      titulo: a.titulo,
    })),
  };

  return JSON.stringify(paquete, null, 2);
}

export function generarExportPlano(terreno: Terreno, zonas: Zona[]): string {
  // Estructura lista para clonar directo en Supabase sin descubrimiento de schema.
  // DB: tabla terrenos(id, proyecto_id, nombre, datos jsonb, created_at, updated_at)
  // DB: tabla zonas(id, terreno_id, nombre, tipo, datos jsonb, created_at, updated_at)
  const plano = {
    plano_version: "1.1",
    _db: {
      // proyecto_id del terreno origen — necesario para el INSERT de clonación
      proyecto_id: terreno.proyecto_id,
      // SQL de clonación (reemplazar :nuevo_nombre y ejecutar directamente):
      // WITH t AS (INSERT INTO terrenos(id,proyecto_id,nombre,datos,created_at,updated_at)
      //   VALUES(gen_random_uuid(),:proyecto_id,:nuevo_nombre,:terreno_datos::jsonb,now(),now()) RETURNING id)
      // INSERT INTO zonas(id,terreno_id,nombre,tipo,datos,created_at,updated_at)
      //   SELECT gen_random_uuid(),t.id,z.nombre,z.tipo,z.datos::jsonb,now(),now()
      //   FROM t, json_array_elements(:zonas_json) AS z(v)
      //   CROSS JOIN LATERAL (SELECT v->>'nombre' AS nombre, v->>'tipo' AS tipo, v AS datos) AS z(nombre,tipo,datos);
    },
    terreno: {
      nombre: terreno.nombre,
      // datos jsonb completo listo para INSERT directo
      datos: {
        ancho_m: terreno.ancho_m,
        alto_m: terreno.alto_m,
        area_m2: terreno.area_m2,
        agua_disponible_m3: terreno.agua_disponible_m3,
        agua_actual_m3: terreno.agua_actual_m3,
        suelo: terreno.suelo ?? null,
        sistema_riego: terreno.sistema_riego ?? null,
      },
    },
    zonas: zonas.map((z) => ({
      nombre: z.nombre,
      tipo: z.tipo,
      // datos jsonb completo listo para INSERT directo
      datos: {
        x: z.x,
        y: z.y,
        ancho: z.ancho,
        alto: z.alto,
        area_m2: z.area_m2,
        color: z.color,
        estado: z.estado,
        notas: z.notas ?? "",
        ...(z.configuracion_riego
          ? { configuracion_riego: z.configuracion_riego }
          : {}),
        ...(z.estanque_config ? { estanque_config: z.estanque_config } : {}),
      },
    })),
  };
  return JSON.stringify(plano, null, 2);
}

// ─── Utilidad reutilizable ──────────────────────────────────────────

export function logExportError(contexto: string, error: unknown): void {
  logger.error(`Export: ${contexto}`, {
    error:
      error instanceof Error
        ? { message: error.message, stack: error.stack }
        : { error },
  });
}
