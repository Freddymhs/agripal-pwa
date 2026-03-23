/**
 * seed-proyecto-portero.mts
 * Crea el "Proyecto Portero" — proyecto de entrada para aprender agricultura
 * con restricción de estanque 3 m³ y transporte Porter.
 *
 * Filosofía: validar que la agricultura funciona a escala micro antes de
 * invertir en un estanque grande. Los mejores cultivos del proyecto
 * "IA Experta" pero en parcelas pequeñas (200-300 m²).
 *
 * Costos reales Porter:
 *   Agua: 1.5 m³/viaje × $2,000/m³ = $3,000
 *   Diesel: ida+vuelta 55km = $6,438
 *   Total: $9,438 / 1.5 m³ = $6,292/m³ efectivo
 *
 * Terrenos:
 * 1. Portero: Huerta Rápida (20×12m = 240 m²)
 *    Ajo + Tomate Cherry + Orégano — retorno inmediato
 * 2. Portero: Frutal Estrella (20×15m = 300 m²)
 *    Pitahaya + Arándano Maceta — inversión alto valor a mediano plazo
 * 3. Portero: Frutal Aprendizaje (20×20m = 400 m²)
 *    Granada + Higuera — "plant now, profit later": pierden a Porter
 *    pero serán rentables al cambiar a estanque grande (agua barata)
 *
 * Uso:
 *   npx tsx scripts/seed-proyecto-portero.mts --dry-run
 *   npx tsx scripts/seed-proyecto-portero.mts
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

// ─── Tipos ──────────────────────────────────────────────────────────────────

type TipoRiego = "programado" | "manual_sesiones" | "manual_balde";
type EtapaCrecimiento = "plántula" | "joven" | "adulta" | "madura";
type EstadoPlanta = "plantada" | "creciendo" | "produciendo" | "muerta";

interface SueloDef {
  fisico: {
    ph: number;
    textura: string;
    drenaje: string;
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
  precio_m3_clp: number;
  confiabilidad: "alta" | "media" | "baja";
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
  capacidad_litros: number;
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
}

interface TerrenoDef {
  nombre: string;
  estrategia: string;
  ancho_m: number;
  alto_m: number;
  suelo: SueloDef;
  agua: AguaDef;
  estanque: EstanqueDef;
  zonas: ZonaDef[];
  notas: {
    justificacion: string;
    riesgo_principal: string;
    objetivo_economico: string;
  };
}

// ─── Constantes Porter ──────────────────────────────────────────────────────
// Agua: 1.5 m³/viaje × $2,000/m³ = $3,000
// Diesel: ida+vuelta 55km = $6,438
// Total: $9,438 / 1.5 m³ = $6,292/m³ efectivo

export const PORTER_PRECIO_AGUA_M3 = 2000;
export const PORTER_TRANSPORTE_CLP = 6438;
export const PORTER_RECARGA_LITROS = 1500; // 1.5 m³ por viaje
export const PORTER_COSTO_EFECTIVO_M3 = PORTER_PRECIO_AGUA_M3 + PORTER_TRANSPORTE_CLP / (PORTER_RECARGA_LITROS / 1000);

export const MARGEN_BORDE = 1;
export const MAX_PLANTAS_POR_ZONA = 500; // cap para zonas muy densas (ajo)

// ─── Suelo pampa Arica (reutilizable) ───────────────────────────────────────

const SUELO_PAMPA: SueloDef = {
  fisico: {
    ph: 7.5,
    textura: "franco-arenosa",
    drenaje: "rapido",
    profundidad_efectiva_cm: 80,
    materia_organica_pct: 0.5,
  },
  quimico: {
    salinidad_dS_m: 1.8,
    boro_mg_l: 0.5,
    arsenico_mg_l: 0.01,
    nitrogeno_ppm: 10,
    fosforo_ppm: 5,
    potasio_ppm: 100,
    calcio_ppm: 2000,
    magnesio_ppm: 250,
  },
};

// ─── Agua Porter (compartida) ───────────────────────────────────────────────

const AGUA_PORTER: AguaDef = {
  precio_m3_clp: PORTER_PRECIO_AGUA_M3,
  confiabilidad: "media",
  calidad: { salinidad_dS_m: 0.5, boro_ppm: 0.1, arsenico_mg_l: 0.01 },
  recarga: {
    frecuencia_dias: 7,
    cantidad_litros: PORTER_RECARGA_LITROS,
    costo_transporte_clp: PORTER_TRANSPORTE_CLP,
  },
};

// ─── Definiciones de terrenos ───────────────────────────────────────────────

export const TERRENOS: TerrenoDef[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // T1: Huerta Rápida — Ajo + Tomate Cherry + Orégano
  // Retorno inmediato. Ajo produce en meses, Tomate en temporada, Orégano bajo agua.
  // ROI esperado: Ajo 2693%, Tomate 1060%, Orégano 372% (a 200 m², $6,292/m³)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    nombre: "Portero: Huerta Rápida",
    estrategia: "Verduras de retorno rápido con tanque 3m³ Porter. Ajo ultra-rentable + Tomate Cherry + Orégano aromático.",
    ancho_m: 20,
    alto_m: 12,
    suelo: SUELO_PAMPA,
    agua: AGUA_PORTER,
    estanque: {
      nombre: "IBC 3m³ Portero",
      capacidad_litros: 3000,
      x: 8, y: 4, ancho: 4, alto: 3,
    },
    zonas: [
      {
        nombre: "Ajo Morado",
        cultivo_base_id: "verdura-ajo",
        x: 1, y: 1, ancho: 6, alto: 3,
        riego: { tipo: "programado", caudal_total_lh: 20, horas_dia: 0.5 },
        fecha_plantacion: "2026-03-15",
        etapa_actual: "plántula",
        estado_plantas: "plantada",
      },
      {
        nombre: "Tomate Cherry",
        cultivo_base_id: "huerto-tomate-cherry",
        x: 1, y: 5, ancho: 7, alto: 6,
        riego: { tipo: "programado", caudal_total_lh: 60, horas_dia: 1 },
        fecha_plantacion: "2026-04-01",
        etapa_actual: "plántula",
        estado_plantas: "plantada",
      },
      {
        nombre: "Orégano Seco",
        cultivo_base_id: "verdura-oregano",
        x: 14, y: 1, ancho: 5, alto: 5,
        riego: { tipo: "programado", caudal_total_lh: 15, horas_dia: 0.5 },
        fecha_plantacion: "2026-03-20",
        etapa_actual: "plántula",
        estado_plantas: "plantada",
      },
    ],
    notas: {
      justificacion: "Ajo (ROI 2693%), Tomate Cherry (1060%), Orégano (372%) — los 3 verduras más rentables con agua cara. Todas producen dentro del primer año.",
      riesgo_principal: "Estanque 3m³ limita escala. Refill cada 10-20 días según estación.",
      objetivo_economico: "Generar primeros ingresos, validar la fórmula, costear el estanque grande.",
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // T2: Frutal Estrella — Pitahaya + Arándano Maceta
  // Inversión a mediano plazo. Los 2 frutales con mayor productividad/m³ agua.
  // ROI esperado: Pitahaya 1387%, Arándano 384% (a 200 m², $6,292/m³)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    nombre: "Portero: Frutal Estrella",
    estrategia: "Frutales premium de alto valor por m³ de agua. Pitahaya CAM + Arándano en maceta con sustrato controlado.",
    ancho_m: 20,
    alto_m: 15,
    suelo: SUELO_PAMPA,
    agua: AGUA_PORTER,
    estanque: {
      nombre: "IBC 3m³ Portero",
      capacidad_litros: 3000,
      x: 8, y: 6, ancho: 4, alto: 3,
    },
    zonas: [
      {
        nombre: "Pitahaya CAM",
        cultivo_base_id: "cultivo-pitahaya",
        x: 1, y: 1, ancho: 12, alto: 5,
        riego: { tipo: "programado", caudal_total_lh: 30, horas_dia: 1 },
        fecha_plantacion: "2026-04-01",
        etapa_actual: "plántula",
        estado_plantas: "plantada",
      },
      {
        nombre: "Arándano Maceta",
        cultivo_base_id: "cultivo-arandano-maceta",
        x: 1, y: 8, ancho: 10, alto: 6,
        riego: { tipo: "programado", caudal_total_lh: 40, horas_dia: 1 },
        fecha_plantacion: "2026-04-15",
        etapa_actual: "plántula",
        estado_plantas: "plantada",
      },
    ],
    notas: {
      justificacion: "Pitahaya ($26,182/m³ productividad agua) y Arándano ($32,527/m³) son los 2 frutales con mayor retorno por litro de agua en Arica.",
      riesgo_principal: "Producción significativa desde año 2-3. Requiere paciencia e inversión inicial en plantas.",
      objetivo_economico: "Inversión a mediano plazo. Cuando produzcan, justifican saltar al estanque grande y escalar.",
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // T3: Frutal Aprendizaje — Granada + Higuera
  // "Plant now, profit later": estos frutales NO son rentables a $6,292/m³
  // Porter pero SÍ lo serán cuando se cambie a estanque grande ($4,500/m³)
  // o pozo compartido ($3,500/m³). Al plantarlos ahora, los árboles maduran
  // durante la fase de aprendizaje y estarán produciendo cuando el agua
  // se abarate.
  //
  // Granada: ROI -332% a Porter → +428% en transición Porter→Aljibe
  //   Tolerancia alta salinidad (FL 2%), no produce años 1-2, año 5 = 600 kg/400m²
  // Higuera: ROI -1860% a Porter → +704% en transición Porter→Pozo
  //   Más arriesgada, requiere agua barata. Higos secos = mercado premium $2,200/kg
  // ═══════════════════════════════════════════════════════════════════════════
  {
    nombre: "Portero: Frutal Aprendizaje",
    estrategia: "Frutales de maduración lenta: pierden dinero con agua cara pero serán rentables al cambiar a estanque grande. Plantar hoy, ganar mañana.",
    ancho_m: 20,
    alto_m: 20,
    suelo: SUELO_PAMPA,
    agua: AGUA_PORTER,
    estanque: {
      nombre: "IBC 3m³ Portero",
      capacidad_litros: 3000,
      x: 8, y: 9, ancho: 4, alto: 3,
    },
    zonas: [
      {
        nombre: "Granada",
        cultivo_base_id: "cultivo-granada",
        x: 1, y: 1, ancho: 18, alto: 8,
        riego: { tipo: "programado", caudal_total_lh: 25, horas_dia: 1 },
        fecha_plantacion: "2026-04-01",
        etapa_actual: "plántula",
        estado_plantas: "plantada",
      },
      {
        nombre: "Higuera",
        cultivo_base_id: "cultivo-higuera",
        x: 1, y: 13, ancho: 18, alto: 6,
        riego: { tipo: "programado", caudal_total_lh: 20, horas_dia: 1 },
        fecha_plantacion: "2026-04-15",
        etapa_actual: "plántula",
        estado_plantas: "plantada",
      },
    ],
    notas: {
      justificacion: "Granada (ROI +428% transición aljibe) e Higuera (ROI +704% transición pozo) son frutales que maduran lento. Plantarlos ahora con Kr=0.15 (bajo consumo año 1) permite que estén produciendo cuando el agua se abarate.",
      riesgo_principal: "ROI negativo mientras se use Porter. Granada no produce años 1-2. Higuera requiere pozo ($3,500/m³) para ser rentable. Inversión a fondo perdido si no se cambia de fuente de agua.",
      objetivo_economico: "Inversión educativa años 1-2. Al migrar a estanque 10m³+ (año 3), los árboles ya estarán en producción y generarán ingreso inmediato.",
    },
  },
];

// ─── Main ───────────────────────────────────────────────────────────────────

async function run() {
  // Get Freddy's user
  const { data: usersData } = await supabase.auth.admin.listUsers();
  const freddy = usersData?.users.find((u) => u.email === "fmarcosdev@gmail.com");
  if (!freddy) { console.error("Usuario Freddy no encontrado"); return; }

  const userId = freddy.id;
  console.log(`Usuario: ${freddy.email} (${userId.slice(0, 8)}...)`);

  // Create project — trigger will copy catalogo_base → catalogo_cultivos
  const proyectoId = randomUUID();
  const proyectoRow = {
    id: proyectoId,
    usuario_id: userId,
    nombre: "Proyecto Portero",
    datos: {
      descripcion: "Proyecto de entrada para aprender agricultura con estanque 3m³ y transporte Porter. Parcelas micro (200-300 m²) con los cultivos más rentables.",
    },
  };

  console.log(`\nProyecto: ${proyectoRow.nombre}`);

  if (!DRY_RUN) {
    const { error } = await supabase.from("proyectos").insert(proyectoRow);
    if (error) { console.error("ERROR proyecto:", error.message); return; }
    // Esperar trigger que copia catálogo
    await new Promise((r) => setTimeout(r, 2000));
  }
  console.log(`  Creado: ${proyectoId.slice(0, 8)}...`);

  // Load catalogo_cultivos for this project (populated by trigger)
  const { data: catalogo } = await supabase
    .from("catalogo_cultivos")
    .select("id, nombre, cultivo_base_id, datos")
    .eq("proyecto_id", proyectoId);

  if (!catalogo?.length && !DRY_RUN) {
    console.error("Catálogo vacío — el trigger puede no haber copiado los cultivos");
    return;
  }

  const catByBaseId = new Map(
    (catalogo ?? []).map((c) => [c.cultivo_base_id, c]),
  );
  console.log(`  Catálogo: ${catalogo?.length ?? 0} cultivos copiados por trigger`);

  // Get fuentes de agua del proyecto
  const { data: fuentes } = await supabase
    .from("fuentes_agua_proyecto")
    .select("id, nombre, datos")
    .eq("proyecto_id", proyectoId);

  const fuenteAljibe = (fuentes ?? []).find((f) =>
    (f.nombre as string).toLowerCase().includes("aljibe"),
  );
  const fuenteId = (fuenteAljibe as { id: string } | undefined)?.id ?? null;
  console.log(`  Fuentes agua: ${fuentes?.length ?? 0} | Aljibe: ${fuenteAljibe ? "encontrada" : "no encontrada"}`);

  // ─── Process each terreno ───
  for (const tDef of TERRENOS) {
    console.log(`\n${"═".repeat(80)}`);
    console.log(`TERRENO: ${tDef.nombre} (${tDef.ancho_m}×${tDef.alto_m}m = ${tDef.ancho_m * tDef.alto_m} m²)`);
    console.log(`  Estrategia: ${tDef.estrategia}`);

    // Create proveedor
    const proveedorId = randomUUID();
    const proveedorData = {
      id: proveedorId,
      nombre: "Porter Propia (1.5m³/viaje)",
      precio_m3_clp: PORTER_PRECIO_AGUA_M3,
      confiabilidad: tDef.agua.confiabilidad,
      fuente_agua_id: fuenteId,
      es_principal: true,
    };

    // Create terreno
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
        agua_fuente: "aljibe",
        agua_confiabilidad: tDef.agua.confiabilidad,
        agua_costo_clp_por_m3: PORTER_COSTO_EFECTIVO_M3,
        sistema_riego: {
          litros_hora: 0,
          descuento_auto: false,
          ultima_actualizacion: NOW,
        },
        suelo: tDef.suelo,
        agua_avanzada: {
          proveedores: [proveedorData],
          calidad: {
            analisis_realizado: true,
            fuente: "aljibe",
            salinidad_dS_m: tDef.agua.calidad.salinidad_dS_m,
            boro_ppm: tDef.agua.calidad.boro_ppm,
            arsenico_mg_l: tDef.agua.calidad.arsenico_mg_l,
          },
        },
        ubicacion: {
          region: "Arica y Parinacota",
          comuna: "Arica",
        },
        notas_portero: tDef.notas,
      },
    };

    console.log(`  Agua: Porter $${PORTER_PRECIO_AGUA_M3}/m³ + transporte $${PORTER_TRANSPORTE_CLP}/viaje = $${Math.round(PORTER_COSTO_EFECTIVO_M3)}/m³ efectivo`);
    console.log(`  Estanque: ${tDef.estanque.nombre} (${tDef.estanque.capacidad_litros}L)`);
    console.log(`  Suelo: pH ${tDef.suelo.fisico.ph} | ${tDef.suelo.fisico.textura} | CE ${tDef.suelo.quimico.salinidad_dS_m} dS/m`);

    if (!DRY_RUN) {
      const { error } = await supabase.from("terrenos").insert(terrenoRow);
      if (error) { console.error("  ERROR terreno:", error.message); continue; }
    }
    console.log(`  Terreno: ${terrenoId.slice(0, 8)}...`);

    // ─── Create estanque ───
    const estanqueId = randomUUID();
    const eDef = tDef.estanque;

    const estanqueRow = {
      id: estanqueId,
      terreno_id: terrenoId,
      nombre: eDef.nombre,
      tipo: "estanque",
      x: eDef.x,
      y: eDef.y,
      ancho: eDef.ancho,
      alto: eDef.alto,
      area_m2: eDef.ancho * eDef.alto,
      datos: {
        x: eDef.x, y: eDef.y,
        ancho: eDef.ancho, alto: eDef.alto,
        area_m2: eDef.ancho * eDef.alto,
        color: "#0ea5e9",
        estado: "activa",
        estanque_config: {
          capacidad_m3: eDef.capacidad_litros / 1000,
          capacidad_litros: eDef.capacidad_litros,
          nivel_actual_m3: eDef.capacidad_litros / 1000,
          material: "plastico",
          tiene_tapa: true,
          tiene_filtro: false,
          proveedor_id: proveedorId,
          fuente_agua_id: fuenteId,
          costo_por_m3: PORTER_COSTO_EFECTIVO_M3,
          recarga: {
            frecuencia_dias: tDef.agua.recarga.frecuencia_dias,
            cantidad_litros: tDef.agua.recarga.cantidad_litros,
            costo_transporte_clp: tDef.agua.recarga.costo_transporte_clp,
            ultima_recarga: NOW,
            proxima_recarga: new Date(
              Date.now() + tDef.agua.recarga.frecuencia_dias * 86400000,
            ).toISOString(),
          },
        },
      },
    };

    if (!DRY_RUN) {
      const { error } = await supabase.from("zonas").insert(estanqueRow);
      if (error) { console.error(`  ERROR estanque:`, error.message); continue; }
    }
    console.log(`  Estanque: ${estanqueId.slice(0, 8)}...`);

    // ─── Create zonas de cultivo + plantas ───
    for (const zDef of tDef.zonas) {
      const cultivoCopy = catByBaseId.get(zDef.cultivo_base_id);

      if (!cultivoCopy && !DRY_RUN) {
        console.error(`  SKIP zona "${zDef.nombre}": cultivo_base_id "${zDef.cultivo_base_id}" no encontrado en catálogo`);
        continue;
      }

      const cultivoId = cultivoCopy?.id ?? "dry-run-id";
      const espaciado = (cultivoCopy?.datos as Record<string, unknown>)?.espaciado_recomendado_m as number ?? 1;

      const zonaId = randomUUID();
      const areaM2 = zDef.ancho * zDef.alto;

      const zonaRow = {
        id: zonaId,
        terreno_id: terrenoId,
        nombre: zDef.nombre,
        tipo: "cultivo",
        x: zDef.x,
        y: zDef.y,
        ancho: zDef.ancho,
        alto: zDef.alto,
        area_m2: areaM2,
        datos: {
          x: zDef.x, y: zDef.y,
          ancho: zDef.ancho, alto: zDef.alto,
          area_m2: areaM2,
          color: "#16a34a",
          estado: "activa",
          estanque_id: estanqueId,
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

      // Generate plant grid — coords RELATIVE to zone
      const anchoDisp = zDef.ancho - MARGEN_BORDE * 2;
      const altoDisp = zDef.alto - MARGEN_BORDE * 2;

      if (anchoDisp <= 0 || altoDisp <= 0) {
        console.warn(`  WARN zona "${zDef.nombre}": zona demasiado pequeña para margen (${zDef.ancho}×${zDef.alto}m, margen ${MARGEN_BORDE}m)`);
        continue;
      }

      const columnasMax = Math.floor(anchoDisp / espaciado) + 1;
      const filasMax = Math.floor(altoDisp / espaciado) + 1;
      const anchoGrid = (columnasMax - 1) * espaciado;
      const altoGrid = (filasMax - 1) * espaciado;
      const margenX = (zDef.ancho - anchoGrid) / 2;
      const margenY = (zDef.alto - altoGrid) / 2;

      let totalPosiciones = columnasMax * filasMax;

      // Cap plants for very dense crops (ajo at 0.15m spacing)
      if (totalPosiciones > MAX_PLANTAS_POR_ZONA) {
        console.log(`  CAP: ${zDef.nombre} tendría ${totalPosiciones} plantas, limitando a ${MAX_PLANTAS_POR_ZONA}`);
        totalPosiciones = MAX_PLANTAS_POR_ZONA;
      }

      const plantasRows: Record<string, unknown>[] = [];
      let plantaIdx = 0;

      for (let fila = 0; fila < filasMax && plantaIdx < totalPosiciones; fila++) {
        for (let col = 0; col < columnasMax && plantaIdx < totalPosiciones; col++) {
          plantasRows.push({
            id: randomUUID(),
            zona_id: zonaId,
            tipo_cultivo_id: cultivoId,
            estado: zDef.estado_plantas,
            etapa_actual: zDef.etapa_actual,
            x: Math.round((margenX + col * espaciado) * 1000) / 1000,
            y: Math.round((margenY + fila * espaciado) * 1000) / 1000,
            datos: {
              fecha_plantacion: zDef.fecha_plantacion,
            },
          });
          plantaIdx++;
        }
      }

      if (!DRY_RUN && plantasRows.length > 0) {
        for (let i = 0; i < plantasRows.length; i += 100) {
          const batch = plantasRows.slice(i, i + 100);
          const { error } = await supabase.from("plantas").insert(batch);
          if (error) { console.error(`  ERROR plantas batch ${zDef.nombre}:`, error.message); break; }
        }
      }

      console.log(`  Zona: ${zDef.nombre} (${zDef.ancho}×${zDef.alto}m = ${areaM2}m²)`);
      console.log(`    Cultivo: ${zDef.cultivo_base_id} (esp ${espaciado}m) → ${plantasRows.length} plantas`);
      console.log(`    Riego: ${zDef.riego.tipo} ${zDef.riego.caudal_total_lh} L/h × ${zDef.riego.horas_dia}h/día`);
      console.log(`    Etapa: ${zDef.etapa_actual} | Estado: ${zDef.estado_plantas} | Plantado: ${zDef.fecha_plantacion}`);
    }

    console.log(`\n  Notas: ${tDef.notas.justificacion}`);
    console.log(`  Riesgo: ${tDef.notas.riesgo_principal}`);
    console.log(`  Objetivo: ${tDef.notas.objetivo_economico}`);
  }

  console.log(`\n${"═".repeat(80)}`);
  console.log(DRY_RUN
    ? "DRY RUN — nada fue escrito en BD"
    : `DONE — "Proyecto Portero" con ${TERRENOS.length} terrenos creado`);
  console.log(`  Costo agua efectivo: $${Math.round(PORTER_COSTO_EFECTIVO_M3)}/m³`);
  console.log(`  Estanque: 3 m³ (IBC plástico)`);
  console.log(`  Transporte: Porter propia 1.5m³/viaje, 55km ida+vuelta`);
}

if (import.meta.url === new URL(process.argv[1], "file:").href) {
  run().catch(console.error);
}
