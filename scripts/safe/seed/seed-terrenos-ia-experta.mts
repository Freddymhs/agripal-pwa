/**
 * seed-terrenos-ia-experta.mts
 * Crea el proyecto "IA Experta: Terrenos Simulados" con los 8 terrenos completos.
 *
 * Terrenos:
 * 1. Pampa Alta Eficiencia    — Pitahaya CAM + Melón Primor (aljibe $6,000/m³)
 * 2. Valle Costero Subtropical — Olivo + Uva Primor (canal $150/m³)
 * 3. Secano de Acumulación    — Tuna + Higuera (lluvia $0/m³)
 * 4. Arándano Intensivo       — Arándano en Maceta (break-even $23,311/m³)
 * 5. Premium Mix              — Pitahaya + Arándano + Granada (top 3 eficiencia agua)
 * 6. Resistente Árido         — Tuna + Granada (ultra-tolerantes, margen seguro)
 * 7. Aromáticas & Superfoods  — Romero + Orégano + Quinoa (break-even >$14k)
 * 8. Huerto Intensivo         — Tomate Cherry + Ajo + Ají (ciclo rápido)
 *
 * Idempotente: re-ejecutar saltea terrenos ya existentes.
 *
 * Uso:
 *   npx tsx scripts/seed-terrenos-ia-experta.mts --dry-run
 *   npx tsx scripts/seed-terrenos-ia-experta.mts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DRY_RUN = process.argv.includes("--dry-run");
const NOW = new Date().toISOString();
export const MAX_PLANTAS_POR_ZONA = 5000;
export const MARGEN_BORDE = 2;

// ─── Tipos ──────────────────────────────────────────────────────────────────

type TipoRiego = "programado" | "manual_sesiones" | "manual_balde";
type MaterialEstanque = "plastico" | "cemento" | "geomembrana" | "metalico";
type EtapaCrecimiento = "plántula" | "joven" | "adulta" | "madura";
type EstadoPlanta = "plantada" | "creciendo" | "produciendo" | "muerta";
type TexturaSuelo = "arenosa" | "franco-arenosa" | "franco" | "franco-arcillosa" | "arcillosa";
type DrenajeSuelo = "rapido" | "bueno" | "moderado" | "lento";

interface SueloDef {
  fisico: {
    ph: number;
    textura: TexturaSuelo;
    drenaje: DrenajeSuelo;
    profundidad_efectiva_cm: number;
    materia_organica_pct: number;
  };
  quimico: {
    salinidad_dS_m: number;
    boro_mg_l: number;
    arsenico_mg_l: number;
    nitrogeno_ppm: number;
    fosforo_ppm: number;
    potasio_ppm: number;
    calcio_ppm: number;
    magnesio_ppm: number;
  };
}

interface AguaDef {
  fuente: "aljibe" | "pozo" | "riego" | "lluvia";
  precio_m3_clp: number;
  confiabilidad: "alta" | "media" | "baja";
  nombre_proveedor: string;
  calidad: {
    salinidad_dS_m: number;
    boro_ppm: number;
    arsenico_mg_l: number;
  };
  recarga: {
    frecuencia_dias: number;
    cantidad_litros: number;
    costo_transporte_clp: number;
  };
}

interface EstanqueDef {
  nombre: string;
  capacidad_m3: number;
  nivel_actual_m3: number;
  material: MaterialEstanque;
  tiene_tapa: boolean;
  tiene_filtro: boolean;
  x: number; y: number; ancho: number; alto: number;
}

interface ZonaDef {
  nombre: string;
  cultivo_base_id: string;
  x: number; y: number; ancho: number; alto: number;
  riego: {
    tipo: TipoRiego;
    caudal_total_lh: number;
    horas_dia: number;
  };
  fecha_plantacion: string;
  etapa_actual: EtapaCrecimiento;
  estado_plantas: EstadoPlanta;
  mortalidad_pct: number;
}

interface TerrenoDef {
  nombre: string;
  estrategia: string;
  ancho_m: number;
  alto_m: number;
  suelo: SueloDef;
  agua: AguaDef;
  estanques: EstanqueDef[];
  zonas: ZonaDef[];
  notas: {
    justificacion: string;
    riesgo_principal: string;
    objetivo_economico: string;
  };
}

// ─── Definiciones de terrenos ────────────────────────────────────────────────

export const TERRENOS: TerrenoDef[] = [
  // ══════════════════════════════════════════════════════════════════════════
  // T1: Pampa de Alta Eficiencia — Pitahaya CAM + Melón Primor
  // Agua aljibe $6,000/m³. Solo cultivos con break-even > $6,000.
  // ══════════════════════════════════════════════════════════════════════════
  {
    nombre: "IA Experta: Pampa Alta Eficiencia",
    estrategia: "Máxima rentabilidad por m³ de agua mediante Pitahaya CAM y Melón Primor contra-estación",
    ancho_m: 100,
    alto_m: 100,
    suelo: {
      fisico: { ph: 7.5, textura: "franco-arenosa", drenaje: "rapido", profundidad_efectiva_cm: 80, materia_organica_pct: 0.5 },
      quimico: { salinidad_dS_m: 1.8, boro_mg_l: 0.5, arsenico_mg_l: 0.01, nitrogeno_ppm: 10, fosforo_ppm: 5, potasio_ppm: 100, calcio_ppm: 2000, magnesio_ppm: 250 },
    },
    agua: {
      fuente: "aljibe",
      precio_m3_clp: 6000,
      confiabilidad: "media",
      nombre_proveedor: "Aljibe Cooperativa (20m³)",
      calidad: { salinidad_dS_m: 0.5, boro_ppm: 0.1, arsenico_mg_l: 0.01 },
      recarga: { frecuencia_dias: 7, cantidad_litros: 20000, costo_transporte_clp: 0 },
    },
    estanques: [
      { nombre: "Estanque Aljibe Principal", capacidad_m3: 30, nivel_actual_m3: 20, material: "geomembrana", tiene_tapa: true, tiene_filtro: true, x: 2, y: 2, ancho: 6, alto: 5 },
    ],
    zonas: [
      {
        nombre: "Pitahaya CAM",
        cultivo_base_id: "cultivo-pitahaya",
        x: 10, y: 10, ancho: 40, alto: 80,
        riego: { tipo: "programado", caudal_total_lh: 200, horas_dia: 1 },
        fecha_plantacion: "2025-04-01",
        etapa_actual: "joven",
        estado_plantas: "creciendo",
        mortalidad_pct: 2,
      },
      {
        nombre: "Melón Primor Invernadero",
        cultivo_base_id: "verdura-melon-primor",
        x: 55, y: 10, ancho: 40, alto: 40,
        riego: { tipo: "programado", caudal_total_lh: 500, horas_dia: 2 },
        fecha_plantacion: "2025-05-01",
        etapa_actual: "adulta",
        estado_plantas: "produciendo",
        mortalidad_pct: 1,
      },
    ],
    notas: {
      justificacion: "Pitahaya sobrevive con poca agua (CAM); Melón Primor se vende a gran precio en contra-estación ago-nov en Lo Valledor, Santiago.",
      riesgo_principal: "Corte de suministro de camiones aljibe en pleno verano hiperárido.",
      objetivo_economico: "Venta directa en Lo Valledor (Santiago) de Melón y venta premium de Pitahaya.",
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // T2: Valle Costero Subtropical — Olivo + Uva Primor
  // Agua de canal $150/m³. Permite frutales de alto consumo.
  // ══════════════════════════════════════════════════════════════════════════
  {
    nombre: "IA Experta: Valle Costero Subtropical",
    estrategia: "Agua de canal barata para frutales intensivos: Olivo calibre extra + Uva Primor",
    ancho_m: 200,
    alto_m: 100,
    suelo: {
      fisico: { ph: 7.2, textura: "franco-arcillosa", drenaje: "moderado", profundidad_efectiva_cm: 120, materia_organica_pct: 1.2 },
      quimico: { salinidad_dS_m: 2.5, boro_mg_l: 1.5, arsenico_mg_l: 0.05, nitrogeno_ppm: 25, fosforo_ppm: 12, potasio_ppm: 150, calcio_ppm: 3000, magnesio_ppm: 350 },
    },
    agua: {
      fuente: "aljibe",
      precio_m3_clp: 2000,
      confiabilidad: "alta",
      nombre_proveedor: "Aljibe Cooperativa (20m³)",
      calidad: { salinidad_dS_m: 0.5, boro_ppm: 1.2, arsenico_mg_l: 0.05 },
      recarga: { frecuencia_dias: 7, cantidad_litros: 20000, costo_transporte_clp: 50000 },
    },
    estanques: [
      { nombre: "Estanque Aljibe (40m³)", capacidad_m3: 40, nivel_actual_m3: 40, material: "geomembrana", tiene_tapa: false, tiene_filtro: true, x: 5, y: 5, ancho: 20, alto: 15 },
    ],
    zonas: [
      {
        nombre: "Olivos Calibre Extra",
        cultivo_base_id: "cultivo-olivo",
        x: 30, y: 10, ancho: 80, alto: 80,
        riego: { tipo: "programado", caudal_total_lh: 1500, horas_dia: 4 },
        fecha_plantacion: "2015-06-01",
        etapa_actual: "adulta",
        estado_plantas: "produciendo",
        mortalidad_pct: 0,
      },
      {
        nombre: "Uva de Mesa Primor",
        cultivo_base_id: "cultivo-uva-mesa-primor",
        x: 120, y: 10, ancho: 70, alto: 80,
        riego: { tipo: "programado", caudal_total_lh: 1200, horas_dia: 3 },
        fecha_plantacion: "2020-07-15",
        etapa_actual: "adulta",
        estado_plantas: "produciendo",
        mortalidad_pct: 1,
      },
    ],
    notas: {
      justificacion: "Agua barata ($150/m³) permite frutales de alto consumo. Olivo y Uva Primor maximizan ingresos con calibre exportación.",
      riesgo_principal: "Acumulación de sales en suelo franco-arcilloso requiere fracción de lavado periódica.",
      objetivo_economico: "Exportación y mercado mayorista nacional premium.",
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // T3: Secano de Acumulación — Tuna + Higuera
  // Agua de lluvia $0/m³. Especies ultra-rústicas.
  // ══════════════════════════════════════════════════════════════════════════
  {
    nombre: "IA Experta: Secano Acumulación",
    estrategia: "Cero costo de agua operativa mediante captura invernal con Tuna e Higuera ultra-rústicas",
    ancho_m: 150,
    alto_m: 150,
    suelo: {
      fisico: { ph: 6.5, textura: "arcillosa", drenaje: "lento", profundidad_efectiva_cm: 60, materia_organica_pct: 2.0 },
      quimico: { salinidad_dS_m: 0.5, boro_mg_l: 0.1, arsenico_mg_l: 0.01, nitrogeno_ppm: 18, fosforo_ppm: 6, potasio_ppm: 110, calcio_ppm: 1800, magnesio_ppm: 200 },
    },
    agua: {
      fuente: "aljibe",
      precio_m3_clp: 2000,
      confiabilidad: "baja",
      nombre_proveedor: "Aljibe Independiente (15m³)",
      calidad: { salinidad_dS_m: 0.5, boro_ppm: 0.1, arsenico_mg_l: 0.0 },
      recarga: { frecuencia_dias: 10, cantidad_litros: 15000, costo_transporte_clp: 52500 },
    },
    estanques: [
      { nombre: "Estanque Aljibe (30m³)", capacidad_m3: 30, nivel_actual_m3: 30, material: "geomembrana", tiene_tapa: false, tiene_filtro: true, x: 10, y: 10, ancho: 30, alto: 30 },
    ],
    zonas: [
      {
        nombre: "Tunal de Secano",
        cultivo_base_id: "cultivo-tuna",
        x: 50, y: 10, ancho: 90, alto: 60,
        riego: { tipo: "programado", caudal_total_lh: 300, horas_dia: 1 },
        fecha_plantacion: "2021-08-20",
        etapa_actual: "adulta",
        estado_plantas: "produciendo",
        mortalidad_pct: 5,
      },
      {
        nombre: "Higueral Tolerante",
        cultivo_base_id: "cultivo-higuera",
        x: 50, y: 80, ancho: 90, alto: 60,
        riego: { tipo: "programado", caudal_total_lh: 400, horas_dia: 2 },
        fecha_plantacion: "2022-08-20",
        etapa_actual: "joven",
        estado_plantas: "creciendo",
        mortalidad_pct: 3,
      },
    ],
    notas: {
      justificacion: "Suelo pobre y dependencia de lluvias obliga a Tuna e Higuera ultra-rústicas. OPEX agua = $0 CLP.",
      riesgo_principal: "Sequía extrema invernal que no recargue el tranque.",
      objetivo_economico: "Minimizar riesgo financiero (OPEX casi cero) y venta en mercado local.",
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // T4: Arándano Intensivo
  // Break-even $23,311/m³. El frutal más eficiente en agua cara.
  // Sustrato controlado en maceta = pH óptimo, sin problemas suelo nativo.
  // ══════════════════════════════════════════════════════════════════════════
  {
    nombre: "IA Experta: Arandano Intensivo",
    estrategia: "Monocultivo de arándano en maceta con sustrato controlado. Máximo valor por m² y por m³ de agua.",
    ancho_m: 50,
    alto_m: 40,
    suelo: {
      fisico: { ph: 5.5, textura: "franco", drenaje: "bueno", profundidad_efectiva_cm: 40, materia_organica_pct: 8.0 },
      quimico: { salinidad_dS_m: 0.3, boro_mg_l: 0.05, arsenico_mg_l: 0.0, nitrogeno_ppm: 40, fosforo_ppm: 20, potasio_ppm: 180, calcio_ppm: 800, magnesio_ppm: 120 },
    },
    agua: {
      fuente: "aljibe",
      precio_m3_clp: 2000,
      confiabilidad: "alta",
      nombre_proveedor: "Aljibe Cooperativa (10m³)",
      calidad: { salinidad_dS_m: 0.3, boro_ppm: 0.05, arsenico_mg_l: 0.0 },
      recarga: { frecuencia_dias: 5, cantidad_litros: 10000, costo_transporte_clp: 25000 },
    },
    estanques: [
      { nombre: "Estanque Arandanos (20m³)", capacidad_m3: 20, nivel_actual_m3: 15, material: "plastico", tiene_tapa: true, tiene_filtro: true, x: 2, y: 2, ancho: 4, alto: 4 },
    ],
    zonas: [
      {
        nombre: "Arandanos en Maceta",
        cultivo_base_id: "cultivo-arandano-maceta",
        x: 8, y: 3, ancho: 38, alto: 34,
        riego: { tipo: "programado", caudal_total_lh: 150, horas_dia: 1 },
        fecha_plantacion: "2025-09-01",
        etapa_actual: "joven",
        estado_plantas: "creciendo",
        mortalidad_pct: 3,
      },
    ],
    notas: {
      justificacion: "Arándano en maceta tiene el break-even más alto de todas las frutas ($23,311/m³). Sustrato controlado (pH 5.5, 8% MO) elimina la limitante del suelo árido nativo.",
      riesgo_principal: "Requiere reposición de sustrato cada 3-4 años. Sensible a olas de calor >35°C.",
      objetivo_economico: "Venta directa en feria a $3,875/kg. Con 2,400 plantas en maceta produce hasta 19,500 kg/ha en año 5.",
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // T5: Premium Mix — Pitahaya + Arándano + Granada
  // Top 3 frutas por eficiencia precio/agua. Diversificación de riesgo.
  // ══════════════════════════════════════════════════════════════════════════
  {
    nombre: "IA Experta: Premium Mix",
    estrategia: "Diversificación con las 3 frutas más eficientes en agua cara: Pitahaya, Arándano en Maceta y Granada.",
    ancho_m: 80,
    alto_m: 60,
    suelo: {
      fisico: { ph: 6.8, textura: "franco-arenosa", drenaje: "bueno", profundidad_efectiva_cm: 70, materia_organica_pct: 1.5 },
      quimico: { salinidad_dS_m: 1.0, boro_mg_l: 0.3, arsenico_mg_l: 0.01, nitrogeno_ppm: 15, fosforo_ppm: 8, potasio_ppm: 130, calcio_ppm: 2200, magnesio_ppm: 280 },
    },
    agua: {
      fuente: "aljibe",
      precio_m3_clp: 2000,
      confiabilidad: "media",
      nombre_proveedor: "Aljibe Cooperativa (20m³)",
      calidad: { salinidad_dS_m: 0.5, boro_ppm: 0.1, arsenico_mg_l: 0.01 },
      recarga: { frecuencia_dias: 7, cantidad_litros: 20000, costo_transporte_clp: 60000 },
    },
    estanques: [
      { nombre: "Estanque Premium (30m³)", capacidad_m3: 30, nivel_actual_m3: 22, material: "geomembrana", tiene_tapa: true, tiene_filtro: true, x: 2, y: 2, ancho: 6, alto: 5 },
    ],
    zonas: [
      {
        nombre: "Pitahaya Premium",
        cultivo_base_id: "cultivo-pitahaya",
        x: 10, y: 5, ancho: 30, alto: 50,
        riego: { tipo: "programado", caudal_total_lh: 150, horas_dia: 1 },
        fecha_plantacion: "2025-04-01",
        etapa_actual: "joven",
        estado_plantas: "creciendo",
        mortalidad_pct: 2,
      },
      {
        nombre: "Arandanos Maceta Mix",
        cultivo_base_id: "cultivo-arandano-maceta",
        x: 44, y: 5, ancho: 20, alto: 25,
        riego: { tipo: "programado", caudal_total_lh: 100, horas_dia: 1 },
        fecha_plantacion: "2025-09-01",
        etapa_actual: "joven",
        estado_plantas: "creciendo",
        mortalidad_pct: 3,
      },
      {
        nombre: "Granados Tolerantes",
        cultivo_base_id: "cultivo-granada",
        x: 44, y: 34, ancho: 30, alto: 22,
        riego: { tipo: "programado", caudal_total_lh: 120, horas_dia: 1.5 },
        fecha_plantacion: "2025-06-01",
        etapa_actual: "joven",
        estado_plantas: "creciendo",
        mortalidad_pct: 1,
      },
    ],
    notas: {
      justificacion: "Pitahaya (break-even $18,934) + Arándano ($23,311) + Granada ($5,788) = las 3 frutas con mejor ratio precio/agua. Diversifica riesgo.",
      riesgo_principal: "Arándano necesita sustrato ácido separado del suelo nativo. Granada es la más ajustada al break-even.",
      objetivo_economico: "Pitahaya y Arándano para venta premium directa. Granada para mercado local y procesamiento.",
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // T6: Resistente Árido — Tuna + Granada
  // Los 2 frutales más tolerantes a sequía. Agua a $4,000/m³ margen seguro.
  // ══════════════════════════════════════════════════════════════════════════
  {
    nombre: "IA Experta: Resistente Arido",
    estrategia: "Frutales ultra-tolerantes a sequía: Tuna (CAM) y Granada. Mínimo consumo de agua, margen seguro.",
    ancho_m: 100,
    alto_m: 80,
    suelo: {
      fisico: { ph: 7.8, textura: "arenosa", drenaje: "rapido", profundidad_efectiva_cm: 50, materia_organica_pct: 0.3 },
      quimico: { salinidad_dS_m: 2.0, boro_mg_l: 0.8, arsenico_mg_l: 0.02, nitrogeno_ppm: 8, fosforo_ppm: 4, potasio_ppm: 90, calcio_ppm: 2500, magnesio_ppm: 200 },
    },
    agua: {
      fuente: "aljibe",
      precio_m3_clp: 2000,
      confiabilidad: "media",
      nombre_proveedor: "Aljibe Vecinal (15m³)",
      calidad: { salinidad_dS_m: 0.5, boro_ppm: 0.1, arsenico_mg_l: 0.01 },
      recarga: { frecuencia_dias: 10, cantidad_litros: 15000, costo_transporte_clp: 30000 },
    },
    estanques: [
      { nombre: "Estanque Arido (25m³)", capacidad_m3: 25, nivel_actual_m3: 18, material: "geomembrana", tiene_tapa: false, tiene_filtro: true, x: 2, y: 2, ancho: 5, alto: 5 },
    ],
    zonas: [
      {
        nombre: "Tunal Extensivo",
        cultivo_base_id: "cultivo-tuna",
        x: 10, y: 5, ancho: 55, alto: 70,
        riego: { tipo: "programado", caudal_total_lh: 200, horas_dia: 0.5 },
        fecha_plantacion: "2024-03-15",
        etapa_actual: "adulta",
        estado_plantas: "produciendo",
        mortalidad_pct: 2,
      },
      {
        nombre: "Granados Aridos",
        cultivo_base_id: "cultivo-granada",
        x: 68, y: 5, ancho: 28, alto: 70,
        riego: { tipo: "programado", caudal_total_lh: 100, horas_dia: 1 },
        fecha_plantacion: "2024-06-01",
        etapa_actual: "joven",
        estado_plantas: "creciendo",
        mortalidad_pct: 2,
      },
    ],
    notas: {
      justificacion: "Tuna (CAM, 2000-3000 m³/ha) y Granada (2500-4000 m³/ha) son los frutales más resistentes a sequía. Break-even Tuna $5,546, Granada $5,788. Suelo pobre no les afecta.",
      riesgo_principal: "Suelo muy arenoso con CE 2.0 dS/m puede estresar la Granada joven. Lavado salino recomendado.",
      objetivo_economico: "Tuna: volumen para mercado local. Granada: valor agregado (jugo, aril). Bajo OPEX, rentabilidad estable.",
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // T7: Aromáticas & Superfoods — Romero + Orégano + Quinoa
  // Break-even >$14k/m³. Ultra bajo consumo de agua. Precio/kg muy alto.
  // ══════════════════════════════════════════════════════════════════════════
  {
    nombre: "IA Experta: Aromaticas & Superfoods",
    estrategia: "Verduras de altísimo valor por kg y mínimo consumo de agua: Romero, Orégano y Quinoa.",
    ancho_m: 60,
    alto_m: 40,
    suelo: {
      fisico: { ph: 7.0, textura: "franco-arenosa", drenaje: "bueno", profundidad_efectiva_cm: 50, materia_organica_pct: 1.0 },
      quimico: { salinidad_dS_m: 1.2, boro_mg_l: 0.4, arsenico_mg_l: 0.01, nitrogeno_ppm: 12, fosforo_ppm: 8, potasio_ppm: 120, calcio_ppm: 2000, magnesio_ppm: 250 },
    },
    agua: {
      fuente: "aljibe",
      precio_m3_clp: 2000,
      confiabilidad: "alta",
      nombre_proveedor: "Aljibe Cooperativa (10m³)",
      calidad: { salinidad_dS_m: 0.4, boro_ppm: 0.1, arsenico_mg_l: 0.0 },
      recarga: { frecuencia_dias: 7, cantidad_litros: 10000, costo_transporte_clp: 30000 },
    },
    estanques: [
      { nombre: "Estanque Aromaticas (15m³)", capacidad_m3: 15, nivel_actual_m3: 12, material: "plastico", tiene_tapa: true, tiene_filtro: true, x: 2, y: 2, ancho: 4, alto: 3 },
    ],
    zonas: [
      {
        nombre: "Romero Arica",
        cultivo_base_id: "verdura-romero",
        x: 8, y: 3, ancho: 16, alto: 34,
        riego: { tipo: "programado", caudal_total_lh: 80, horas_dia: 0.5 },
        fecha_plantacion: "2025-03-15",
        etapa_actual: "adulta",
        estado_plantas: "produciendo",
        mortalidad_pct: 1,
      },
      {
        nombre: "Oregano Seco",
        cultivo_base_id: "verdura-oregano",
        x: 26, y: 3, ancho: 16, alto: 34,
        riego: { tipo: "programado", caudal_total_lh: 80, horas_dia: 0.5 },
        fecha_plantacion: "2025-03-15",
        etapa_actual: "adulta",
        estado_plantas: "produciendo",
        mortalidad_pct: 1,
      },
      {
        nombre: "Quinoa Altiplano",
        cultivo_base_id: "verdura-quinoa",
        x: 44, y: 3, ancho: 12, alto: 34,
        riego: { tipo: "programado", caudal_total_lh: 60, horas_dia: 0.5 },
        fecha_plantacion: "2025-09-01",
        etapa_actual: "joven",
        estado_plantas: "creciendo",
        mortalidad_pct: 2,
      },
    ],
    notas: {
      justificacion: "Romero ($8,000/kg seco), Orégano ($10,000/kg seco) y Quinoa ($6,000/kg). Consumen muy poca agua (1,500-2,100 m³/ha). Break-even >$14,000/m³.",
      riesgo_principal: "Mercado limitado para grandes volúmenes de aromáticas. Requiere secado y procesamiento post-cosecha.",
      objetivo_economico: "Venta de producto seco en ferias y tiendas gourmet. Quinoa para mercado saludable en expansión.",
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // T8: Huerto Intensivo — Tomate Cherry + Ajo + Ají
  // Ciclo rápido, alta demanda local, buena rotación.
  // ══════════════════════════════════════════════════════════════════════════
  {
    nombre: "IA Experta: Huerto Intensivo",
    estrategia: "Verduras de ciclo rápido con alta demanda local: Tomate Cherry, Ajo y Ají. Rotación continua, flujo de caja constante.",
    ancho_m: 70,
    alto_m: 50,
    suelo: {
      fisico: { ph: 6.8, textura: "franco", drenaje: "bueno", profundidad_efectiva_cm: 60, materia_organica_pct: 2.5 },
      quimico: { salinidad_dS_m: 0.8, boro_mg_l: 0.3, arsenico_mg_l: 0.01, nitrogeno_ppm: 30, fosforo_ppm: 15, potasio_ppm: 160, calcio_ppm: 1800, magnesio_ppm: 220 },
    },
    agua: {
      fuente: "aljibe",
      precio_m3_clp: 2000,
      confiabilidad: "alta",
      nombre_proveedor: "Aljibe Cooperativa (15m³)",
      calidad: { salinidad_dS_m: 0.4, boro_ppm: 0.1, arsenico_mg_l: 0.0 },
      recarga: { frecuencia_dias: 5, cantidad_litros: 15000, costo_transporte_clp: 37500 },
    },
    estanques: [
      { nombre: "Estanque Huerto (20m³)", capacidad_m3: 20, nivel_actual_m3: 16, material: "plastico", tiene_tapa: true, tiene_filtro: true, x: 2, y: 2, ancho: 4, alto: 4 },
    ],
    zonas: [
      {
        nombre: "Tomate Cherry Invernadero",
        cultivo_base_id: "huerto-tomate-cherry",
        x: 8, y: 3, ancho: 25, alto: 44,
        riego: { tipo: "programado", caudal_total_lh: 200, horas_dia: 1.5 },
        fecha_plantacion: "2025-08-01",
        etapa_actual: "adulta",
        estado_plantas: "produciendo",
        mortalidad_pct: 2,
      },
      {
        nombre: "Ajo Morado",
        cultivo_base_id: "verdura-ajo",
        x: 35, y: 3, ancho: 15, alto: 44,
        riego: { tipo: "programado", caudal_total_lh: 100, horas_dia: 1 },
        fecha_plantacion: "2025-04-01",
        etapa_actual: "adulta",
        estado_plantas: "produciendo",
        mortalidad_pct: 1,
      },
      {
        nombre: "Aji Pimiento Color",
        cultivo_base_id: "huerto-aji",
        x: 52, y: 3, ancho: 15, alto: 44,
        riego: { tipo: "programado", caudal_total_lh: 120, horas_dia: 1 },
        fecha_plantacion: "2025-08-15",
        etapa_actual: "adulta",
        estado_plantas: "produciendo",
        mortalidad_pct: 2,
      },
    ],
    notas: {
      justificacion: "Tomate Cherry ($1,300/kg, break-even $14,967), Ajo ($4,000/kg, break-even $14,910) y Ají ($1,650/kg, break-even $13,461). Ciclo corto genera flujo de caja rápido.",
      riesgo_principal: "Tomate Cherry es sensible a plagas (Tuta absoluta). Requiere invernadero o malla anti-insectos.",
      objetivo_economico: "Venta directa en feria de Arica y mercados locales. Ajo para mercado mayorista regional.",
    },
  },
];

// ─── Main ────────────────────────────────────────────────────────────────────

async function run() {
  // Get user
  const { data: usersData } = await supabase.auth.admin.listUsers();
  const user = usersData?.users.find((u) => u.email === "fmarcosdev@gmail.com");
  if (!user) { console.error("Usuario no encontrado"); return; }
  console.log(`Usuario: ${user.email} (${user.id.slice(0, 8)}...)`);

  // Find or create project
  const { data: proyectosExistentes } = await supabase
    .from("proyectos")
    .select("id, nombre")
    .ilike("nombre", "%Estanquero%")
    .limit(1);

  let proyectoId: string;
  let proyectoNombre: string;

  if (proyectosExistentes?.[0]) {
    proyectoId = proyectosExistentes[0].id;
    proyectoNombre = proyectosExistentes[0].nombre;
    console.log(`\nProyecto existente: ${proyectoNombre} (${proyectoId.slice(0, 8)}...)`);
  } else {
    proyectoId = randomUUID();
    proyectoNombre = "Estanquero: Cartera Avanzada";
    console.log(`\nCreando proyecto: ${proyectoNombre}`);

    if (!DRY_RUN) {
      const { error } = await supabase.from("proyectos").insert({
        id: proyectoId,
        usuario_id: user.id,
        nombre: proyectoNombre,
        datos: {
          descripcion: "8 terrenos de un agricultor con estanque propio y experiencia consolidada. Todos con aljibe a precio real Arica. Diversificación completa: frutales, verduras, aromáticas.",
        },
      });
      if (error) { console.error("ERROR proyecto:", error.message); return; }
      // Esperar que el trigger copie catalogo_base → catalogo_cultivos
      await new Promise((r) => setTimeout(r, 2000));
    }
    console.log(`  ID: ${proyectoId.slice(0, 8)}...`);
  }

  // Load catalogo_cultivos
  const { data: catalogo } = await supabase
    .from("catalogo_cultivos")
    .select("id, nombre, cultivo_base_id, datos")
    .eq("proyecto_id", proyectoId);

  if (!catalogo?.length && !DRY_RUN) {
    console.error("Catálogo vacío — verificar que el trigger 'on insert on proyectos' esté activo en Supabase");
    return;
  }

  const catByBaseId = new Map(
    (catalogo ?? []).map((c) => [c.cultivo_base_id, c]),
  );
  console.log(`Catálogo: ${catalogo?.length ?? 0} cultivos`);

  // Get fuentes de agua
  const { data: fuentes } = await supabase
    .from("fuentes_agua_proyecto")
    .select("id, nombre")
    .eq("proyecto_id", proyectoId);

  const fuenteByNombre = new Map<string, { id: string; nombre: string }>();
  for (const f of fuentes ?? []) {
    fuenteByNombre.set((f.nombre as string).toLowerCase(), f as { id: string; nombre: string });
  }
  console.log(`Fuentes agua: ${fuentes?.length ?? 0}`);

  // Check existing terrenos for idempotency
  const { data: existentes } = await supabase
    .from("terrenos")
    .select("nombre")
    .eq("proyecto_id", proyectoId);

  const nombresExistentes = new Set((existentes ?? []).map((t) => t.nombre));

  // ─── Process each terreno ───────────────────────────────────────────────
  for (const tDef of TERRENOS) {
    if (nombresExistentes.has(tDef.nombre)) {
      console.log(`\nSKIP: "${tDef.nombre}" ya existe`);
      continue;
    }

    console.log(`\n${"═".repeat(80)}`);
    console.log(`TERRENO: ${tDef.nombre} (${tDef.ancho_m}×${tDef.alto_m}m = ${(tDef.ancho_m * tDef.alto_m / 10000).toFixed(2)} ha)`);
    console.log(`  Estrategia: ${tDef.estrategia}`);

    // Resolve fuente de agua del proyecto
    const fuenteKeyword = tDef.agua.fuente === "riego" ? "canal" : tDef.agua.fuente;
    const fuenteProyecto = [...fuenteByNombre.entries()].find(([k]) => k.includes(fuenteKeyword))?.[1];
    const fuenteId = fuenteProyecto?.id ?? null;

    // Costo efectivo por m³
    const costoTransporteM3 = tDef.agua.recarga.costo_transporte_clp > 0 && tDef.agua.recarga.cantidad_litros > 0
      ? tDef.agua.recarga.costo_transporte_clp / (tDef.agua.recarga.cantidad_litros / 1000)
      : 0;
    const costoEfectivoM3 = tDef.agua.precio_m3_clp + costoTransporteM3;

    const proveedorId = randomUUID();
    const proveedorData = {
      id: proveedorId,
      nombre: tDef.agua.nombre_proveedor,
      precio_m3_clp: tDef.agua.precio_m3_clp,
      confiabilidad: tDef.agua.confiabilidad,
      fuente_agua_id: fuenteId,
      es_principal: true,
    };

    const terrenoId = randomUUID();
    const terrenoRow = {
      id: terrenoId,
      proyecto_id: proyectoId,
      nombre: tDef.nombre,
      ancho_m: tDef.ancho_m,
      alto_m: tDef.alto_m,
      datos: {
        ancho_m: tDef.ancho_m,
        alto_m: tDef.alto_m,
        area_m2: tDef.ancho_m * tDef.alto_m,
        agua_fuente: tDef.agua.fuente,
        agua_confiabilidad: tDef.agua.confiabilidad,
        agua_costo_clp_por_m3: costoEfectivoM3,
        sistema_riego: { litros_hora: 0, descuento_auto: false, ultima_actualizacion: NOW },
        suelo: tDef.suelo,
        agua_avanzada: {
          proveedores: [proveedorData],
          calidad: {
            analisis_realizado: true,
            fuente: tDef.agua.fuente,
            salinidad_dS_m: tDef.agua.calidad.salinidad_dS_m,
            boro_ppm: tDef.agua.calidad.boro_ppm,
            arsenico_mg_l: tDef.agua.calidad.arsenico_mg_l,
          },
        },
        ubicacion: {
          region: "Arica y Parinacota",
          comuna: tDef.nombre.includes("Valle") ? "Azapa" : "Arica",
        },
        notas_ia_experta: tDef.notas,
      },
    };

    console.log(`  Agua: ${tDef.agua.fuente} $${tDef.agua.precio_m3_clp}/m³ efectivo $${Math.round(costoEfectivoM3)}/m³`);
    console.log(`  Suelo: pH ${tDef.suelo.fisico.ph} | ${tDef.suelo.fisico.textura} | CE ${tDef.suelo.quimico.salinidad_dS_m} dS/m`);

    if (!DRY_RUN) {
      const { error } = await supabase.from("terrenos").insert(terrenoRow);
      if (error) { console.error("  ERROR terreno:", error.message); continue; }
    }
    console.log(`  Terreno: ${terrenoId.slice(0, 8)}...`);

    // ─── Estanques ───────────────────────────────────────────────────────
    const estanqueIds: Record<string, string> = {};

    for (const eDef of tDef.estanques) {
      const estanqueId = randomUUID();
      estanqueIds[eDef.nombre] = estanqueId;

      const estanqueRow = {
        id: estanqueId,
        terreno_id: terrenoId,
        nombre: eDef.nombre,
        tipo: "estanque",
        x: eDef.x, y: eDef.y, ancho: eDef.ancho, alto: eDef.alto,
        area_m2: eDef.ancho * eDef.alto,
        datos: {
          x: eDef.x, y: eDef.y, ancho: eDef.ancho, alto: eDef.alto,
          area_m2: eDef.ancho * eDef.alto,
          color: "#0ea5e9",
          estado: "activa",
          estanque_config: {
            capacidad_m3: eDef.capacidad_m3,
            nivel_actual_m3: eDef.nivel_actual_m3,
            material: eDef.material,
            tiene_tapa: eDef.tiene_tapa,
            tiene_filtro: eDef.tiene_filtro,
            proveedor_id: proveedorId,
            fuente_agua_id: fuenteId,
            costo_por_m3: costoEfectivoM3,
            nombre: tDef.agua.nombre_proveedor,
            recarga: {
              frecuencia_dias: tDef.agua.recarga.frecuencia_dias,
              cantidad_litros: tDef.agua.recarga.cantidad_litros,
              costo_transporte_clp: tDef.agua.recarga.costo_transporte_clp,
              ultima_recarga: NOW,
              proxima_recarga: new Date(Date.now() + tDef.agua.recarga.frecuencia_dias * 86400000).toISOString(),
            },
          },
        },
      };

      if (!DRY_RUN) {
        const { error } = await supabase.from("zonas").insert(estanqueRow);
        if (error) { console.error(`  ERROR estanque ${eDef.nombre}:`, error.message); continue; }
      }
      console.log(`  Estanque: ${eDef.nombre} (${eDef.capacidad_m3}m³, ${eDef.material})`);
    }

    // ─── Zonas de cultivo + plantas ──────────────────────────────────────
    for (const zDef of tDef.zonas) {
      const cultivoCopy = catByBaseId.get(zDef.cultivo_base_id);

      if (!cultivoCopy && !DRY_RUN) {
        console.error(`  SKIP zona "${zDef.nombre}": cultivo_base_id "${zDef.cultivo_base_id}" no encontrado`);
        continue;
      }

      const cultivoId = cultivoCopy?.id ?? "dry-run-id";
      const espaciado = (cultivoCopy?.datos as Record<string, unknown>)?.espaciado_recomendado_m as number ?? 1;

      const zonaId = randomUUID();
      const areaM2 = zDef.ancho * zDef.alto;
      const firstEstanqueId = Object.values(estanqueIds)[0];

      const zonaRow = {
        id: zonaId,
        terreno_id: terrenoId,
        nombre: zDef.nombre,
        tipo: "cultivo",
        x: zDef.x, y: zDef.y, ancho: zDef.ancho, alto: zDef.alto,
        area_m2: areaM2,
        datos: {
          x: zDef.x, y: zDef.y, ancho: zDef.ancho, alto: zDef.alto,
          area_m2: areaM2,
          color: "#16a34a",
          estado: "activa",
          estanque_id: firstEstanqueId,
          configuracion_riego: {
            tipo: zDef.riego.tipo,
            caudal_total_lh: zDef.riego.caudal_total_lh,
            horas_dia: zDef.riego.horas_dia,
          },
        },
      };

      if (!DRY_RUN) {
        const { error } = await supabase.from("zonas").insert(zonaRow);
        if (error) { console.error(`  ERROR zona ${zDef.nombre}:`, error.message); continue; }
      }

      // Grid de plantas — coordenadas RELATIVAS a la zona
      const anchoDisp = zDef.ancho - MARGEN_BORDE * 2;
      const altoDisp = zDef.alto - MARGEN_BORDE * 2;
      const columnasMax = Math.floor(anchoDisp / espaciado) + 1;
      const filasMax = Math.floor(altoDisp / espaciado) + 1;
      const totalPosiciones = Math.min(columnasMax * filasMax, MAX_PLANTAS_POR_ZONA);
      const filasEfectivas = Math.min(filasMax, Math.ceil(MAX_PLANTAS_POR_ZONA / columnasMax));
      const anchoGrid = (columnasMax - 1) * espaciado;
      const altoGrid = (filasEfectivas - 1) * espaciado;
      const margenX = (zDef.ancho - anchoGrid) / 2;
      const margenY = (zDef.alto - altoGrid) / 2;
      const muertasCount = Math.round(totalPosiciones * zDef.mortalidad_pct / 100);
      const vivasCount = totalPosiciones - muertasCount;

      const plantasRows: Record<string, unknown>[] = [];
      let plantaIdx = 0;

      for (let fila = 0; fila < filasEfectivas && plantaIdx < totalPosiciones; fila++) {
        for (let col = 0; col < columnasMax && plantaIdx < totalPosiciones; col++) {
          const esMuerta = plantaIdx >= totalPosiciones - muertasCount;
          plantasRows.push({
            id: randomUUID(),
            zona_id: zonaId,
            tipo_cultivo_id: cultivoId,
            estado: esMuerta ? "muerta" : zDef.estado_plantas,
            etapa_actual: esMuerta ? "madura" : zDef.etapa_actual,
            x: Math.round((margenX + col * espaciado) * 1000) / 1000,
            y: Math.round((margenY + fila * espaciado) * 1000) / 1000,
            datos: { fecha_plantacion: zDef.fecha_plantacion },
          });
          plantaIdx++;
        }
      }

      if (!DRY_RUN && plantasRows.length > 0) {
        for (let i = 0; i < plantasRows.length; i += 100) {
          const { error } = await supabase.from("plantas").insert(plantasRows.slice(i, i + 100));
          if (error) { console.error(`  ERROR plantas batch ${zDef.nombre}:`, error.message); break; }
        }
      }

      console.log(`  Zona: ${zDef.nombre} (${zDef.ancho}×${zDef.alto}m = ${areaM2}m²)`);
      console.log(`    Cultivo: ${zDef.cultivo_base_id} (esp ${espaciado}m) → ${vivasCount} vivas + ${muertasCount} muertas = ${totalPosiciones} total`);
      console.log(`    Riego: ${zDef.riego.tipo} ${zDef.riego.caudal_total_lh} L/h × ${zDef.riego.horas_dia}h/día | Plantado: ${zDef.fecha_plantacion}`);
    }
  }

  console.log(`\n${"═".repeat(80)}`);
  console.log(DRY_RUN
    ? "DRY RUN — nada fue escrito en BD"
    : `DONE — "${proyectoNombre}" completo con ${TERRENOS.length} terrenos (todos aljibe, Arica)`);
}

if (import.meta.url === new URL(process.argv[1], "file:").href) {
  run().catch(console.error);
}
