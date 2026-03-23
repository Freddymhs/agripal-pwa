/**
 * analisis-roi.mts
 * Análisis matemático de rentabilidad para los 26 cultivos del catálogo.
 *
 * Replica las fórmulas exactas de src/lib/utils/roi.ts para calcular ROI
 * bajo distintos escenarios de agua y tipos de riego, sin tocar la BD.
 *
 * Lee: data/seed/cultivos-frutas.json + data/seed/cultivos-extras.json
 *
 * Uso:
 *   npx tsx scripts/analisis-roi.mts
 *   npx tsx scripts/analisis-roi.mts --area 5000    # área en m² (default 14000)
 *   npx tsx scripts/analisis-roi.mts --json          # exportar resultados JSON
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ─── Configuración ────────────────────────────────────────────────────────────

const AREA_M2_DEFAULT = 14_000; // 1.4 ha
const M2_POR_HECTAREA = 10_000;
const AÑOS_AMORTIZACION = 5;
const PRECIO_PLANTA_FACTOR = 0.5; // fallback: precioKg × 0.5

interface EscenarioAgua {
  nombre: string;
  /** Precio base del agua al proveedor (CLP/m³) */
  precio_agua_m3: number;
  /** Costo de transporte por viaje (CLP) */
  costo_transporte: number;
  /** m³ que se transportan por viaje */
  m3_por_viaje: number;
}

interface TipoRiego {
  nombre: string;
  tipo: string;
  factor: number;
}

const ESCENARIOS_AGUA: EscenarioAgua[] = [
  // Caso real del usuario
  { nombre: "Porter propia (1.5m³)", precio_agua_m3: 2000, costo_transporte: 6438, m3_por_viaje: 1.5 },
  { nombre: "Aljibe cooperativa (20m³ × $120k)", precio_agua_m3: 6000, costo_transporte: 0, m3_por_viaje: 20 },
  // Hipotéticos para comparar
  { nombre: "Pozo compartido", precio_agua_m3: 800, costo_transporte: 0, m3_por_viaje: 0 },
  { nombre: "Canal riego (Valle)", precio_agua_m3: 120, costo_transporte: 0, m3_por_viaje: 0 },
];

const TIPOS_RIEGO: TipoRiego[] = [
  { nombre: "Goteo programado", tipo: "programado", factor: 1.0 },
  { nombre: "Goteo manual", tipo: "manual_sesiones", factor: 0.9 },
  { nombre: "Balde", tipo: "manual_balde", factor: 0.8 },
];

const FACTOR_SUELO = 1.0; // Sin penalización de suelo (default)

/** Kr — Coeficiente de Reducción por Cobertura (FAO/INIA) */
const KR_POR_AÑO = [0.15, 0.40, 0.70, 0.70, 1.0] as const;

/** Fracción de Lavado por tolerancia a salinidad (CE ~0.5 dS/m) */
const FRACCION_LAVADO: Record<string, number> = {
  alta: 0.02,
  media: 0.04,
  baja: 0.075,
};

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface CultivoSeed {
  id: string;
  nombre: string;
  tipo: string;
  espaciado_recomendado_m: number;
  agua_m3_ha_año_min: number;
  agua_m3_ha_año_max: number;
  precio_kg_min_clp: number;
  precio_kg_max_clp: number;
  precio_planta_clp?: number;
  tiempo_produccion_meses?: number;
  tolerancia_salinidad?: string;
  vida_util_años?: number;
  produccion?: {
    produccion_kg_ha_año2?: number;
    produccion_kg_ha_año3?: number;
    produccion_kg_ha_año4?: number;
    produccion_kg_ha_año5?: number;
  };
}

interface ResultadoROI {
  cultivo: string;
  tipo: string;
  escenario_agua: string;
  tipo_riego: string;
  costo_agua_m3: number;
  area_ha: number;
  plantas: number;
  plantas_por_ha: number;

  // Costos
  costo_plantas_total: number;
  costo_agua_anual: number;
  inversion_total: number;

  // Producción (kg)
  kg_año1: number;
  kg_año2: number;
  kg_año3: number;
  kg_año4: number;
  kg_año5: number;

  // Ingresos
  precio_kg: number;
  ingreso_año4: number;
  ingreso_acumulado_5a: number;

  // Métricas
  roi_5a_pct: number;
  break_even_agua_m3: number | null;
  punto_equilibrio_meses: number | null;
  productividad_agua_clp_m3: number;
  ingreso_neto_anual_estabilizado: number;

  // Logística
  agua_anual_m3: number;
  agua_semanal_m3: number;
  viajes_por_mes: number;
  costo_agua_mensual: number;

  viable: boolean;
}

// ─── Fórmulas (idénticas a src/lib/utils/roi.ts) ─────────────────────────────

function costoAguaEfectivo(esc: EscenarioAgua): number {
  if (esc.m3_por_viaje > 0 && esc.costo_transporte > 0) {
    return esc.precio_agua_m3 + esc.costo_transporte / esc.m3_por_viaje;
  }
  return esc.precio_agua_m3;
}

function calcularROI(
  cultivo: CultivoSeed,
  areaM2: number,
  costoAguaM3: number,
  factorRiego: number,
): Omit<ResultadoROI, "cultivo" | "tipo" | "escenario_agua" | "tipo_riego" | "viajes_por_mes" | "costo_agua_mensual" | "costo_agua_m3"> {
  const areaHa = areaM2 / M2_POR_HECTAREA;
  const espaciado2 = cultivo.espaciado_recomendado_m ** 2;
  const plantasPorHa = espaciado2 > 0 ? M2_POR_HECTAREA / espaciado2 : 0;
  const numPlantas = espaciado2 > 0 ? Math.floor(areaM2 / espaciado2) : 0;
  const factorArea = plantasPorHa > 0 ? numPlantas / plantasPorHa : 0;

  const precioKg = (cultivo.precio_kg_min_clp + cultivo.precio_kg_max_clp) / 2;
  const precioPlantaEstimado = precioKg * PRECIO_PLANTA_FACTOR;
  const precioPlanta = cultivo.precio_planta_clp ?? precioPlantaEstimado;
  const costoPlantasTotal = numPlantas * precioPlanta;

  const aguaPromHaAño = (cultivo.agua_m3_ha_año_min + cultivo.agua_m3_ha_año_max) / 2;
  const fl = FRACCION_LAVADO[cultivo.tolerancia_salinidad ?? "media"] ?? 0.04;
  const aguaAnualNeta = aguaPromHaAño * areaHa;
  const aguaAnualBase = fl > 0 ? aguaAnualNeta / (1 - fl) : aguaAnualNeta;

  // Kr reduce consumo de agua en plantas jóvenes (FAO/INIA)
  const costoAguaPorAño = KR_POR_AÑO.map((kr) => aguaAnualBase * kr * costoAguaM3);
  const costoAguaAnual = costoAguaPorAño[4]; // año adulto para reportes
  const aguaAnualM3 = aguaAnualBase;

  const inversion = costoPlantasTotal + costoAguaPorAño[0];

  // Producción por año
  const tiempoProduccionMeses = cultivo.tiempo_produccion_meses ?? 12;
  const fraccionAño1 = Math.max(0, Math.min(1, (12 - tiempoProduccionMeses) / 12));
  const prod2 = cultivo.produccion?.produccion_kg_ha_año2 ?? 0;
  const prod3 = cultivo.produccion?.produccion_kg_ha_año3 ?? 0;
  const prod4 = cultivo.produccion?.produccion_kg_ha_año4 ?? 0;
  const prod1 = prod2 * fraccionAño1 * 0.5;
  const prod5 = cultivo.produccion?.produccion_kg_ha_año5 ?? prod4;

  const mult = factorArea * FACTOR_SUELO * factorRiego;
  const kg1 = prod1 * mult;
  const kg2 = prod2 * mult;
  const kg3 = prod3 * mult;
  const kg4 = prod4 * mult;
  const kg5 = prod5 * mult;

  const ingreso1 = kg1 * precioKg;
  const ingreso2 = kg2 * precioKg;
  const ingreso3 = kg3 * precioKg;
  const ingreso4 = kg4 * precioKg;
  const ingreso5 = kg5 * precioKg;

  const costoPlantasAnual = costoPlantasTotal / AÑOS_AMORTIZACION;

  const neto1 = ingreso1 - costoAguaPorAño[0] - costoPlantasAnual;
  const neto2 = ingreso2 - costoAguaPorAño[1] - costoPlantasAnual;
  const neto3 = ingreso3 - costoAguaPorAño[2] - costoPlantasAnual;
  const neto4 = ingreso4 - costoAguaPorAño[3] - costoPlantasAnual;
  const neto5 = ingreso5 - costoAguaPorAño[4] - costoPlantasAnual;
  const ingresoAcumulado = neto1 + neto2 + neto3 + neto4 + neto5;

  // Break-even agua (con Kr)
  const totalRevenue5 = ingreso1 + ingreso2 + ingreso3 + ingreso4 + ingreso5;
  const aguaTotalKr5 = KR_POR_AÑO.reduce((s, kr) => s + aguaAnualBase * kr, 0);
  const breakEvenAgua =
    aguaTotalKr5 > 0 && totalRevenue5 > costoPlantasTotal
      ? Math.round((totalRevenue5 - costoPlantasTotal) / aguaTotalKr5)
      : null;

  // ROI
  const roi5 = inversion > 0 ? (ingresoAcumulado / inversion) * 100 : 0;

  // Punto equilibrio (meses)
  let puntoEq: number | null = null;
  if (ingresoAcumulado > 0) {
    let acum = -costoPlantasTotal;
    const mesesData = [
      (ingreso1 - costoAguaPorAño[0]) / 12,
      (ingreso2 - costoAguaPorAño[1]) / 12,
      (ingreso3 - costoAguaPorAño[2]) / 12,
      (ingreso4 - costoAguaPorAño[3]) / 12,
      (ingreso5 - costoAguaPorAño[4]) / 12,
    ];
    for (let mes = 1; mes <= 60; mes++) {
      const añoIdx = Math.min(Math.floor((mes - 1) / 12), 4);
      acum += mesesData[añoIdx];
      if (acum >= 0) {
        puntoEq = mes;
        break;
      }
    }
  }

  // Productividad del agua (CLP revenue por m³ consumido, año estabilizado)
  const productividadAgua = aguaAnualM3 > 0 ? Math.round(ingreso5 / aguaAnualM3) : 0;

  // Ingreso neto anual estabilizado (año 5)
  const netoEstabilizado = ingreso5 - costoAguaPorAño[4] - costoPlantasAnual;

  const aguaSemanalM3 = aguaAnualM3 / 52;

  return {
    area_ha: areaHa,
    plantas: numPlantas,
    plantas_por_ha: plantasPorHa,
    costo_plantas_total: costoPlantasTotal,
    costo_agua_anual: costoAguaAnual,
    inversion_total: inversion,
    kg_año1: kg1,
    kg_año2: kg2,
    kg_año3: kg3,
    kg_año4: kg4,
    kg_año5: kg5,
    precio_kg: precioKg,
    ingreso_año4: ingreso4,
    ingreso_acumulado_5a: ingresoAcumulado,
    roi_5a_pct: Math.round(roi5),
    break_even_agua_m3: breakEvenAgua,
    punto_equilibrio_meses: puntoEq,
    productividad_agua_clp_m3: productividadAgua,
    ingreso_neto_anual_estabilizado: Math.round(netoEstabilizado),
    agua_anual_m3: Math.round(aguaAnualM3),
    agua_semanal_m3: Math.round(aguaSemanalM3 * 10) / 10,
    viable: roi5 > 0,
  };
}

// ─── Helpers de formato ───────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString("es-CL");
}

function fmtCLP(n: number): string {
  const prefix = n < 0 ? "-$" : "$";
  return `${prefix}${fmt(Math.abs(Math.round(n)))}`;
}

function pad(s: string, len: number, align: "left" | "right" = "left"): string {
  if (align === "right") return s.padStart(len);
  return s.padEnd(len);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const areaIdx = args.indexOf("--area");
  const areaM2 = areaIdx >= 0 ? Number(args[areaIdx + 1]) : AREA_M2_DEFAULT;
  const exportJson = args.includes("--json");

  // Cargar cultivos
  const frutasRaw = readFileSync(resolve(ROOT, "data/seed/cultivos-frutas.json"), "utf-8");
  const extrasRaw = readFileSync(resolve(ROOT, "data/seed/cultivos-extras.json"), "utf-8");
  const cultivos: CultivoSeed[] = [...JSON.parse(frutasRaw), ...JSON.parse(extrasRaw)];

  console.log(`\n${"═".repeat(78)}`);
  console.log(`  ANÁLISIS DE RENTABILIDAD — AgriPlan`);
  console.log(`  Área: ${fmt(areaM2)} m² (${(areaM2 / M2_POR_HECTAREA).toFixed(2)} ha)`);
  console.log(`  Cultivos: ${cultivos.length}`);
  console.log(`  Suelo: factor ${FACTOR_SUELO} (sin penalización)`);
  console.log(`${"═".repeat(78)}\n`);

  const todosResultados: ResultadoROI[] = [];

  // ──────────────────────────────────────────────────────────────────────────
  // SECCIÓN 1: Break-even agua por cultivo (independiente de escenario)
  // ──────────────────────────────────────────────────────────────────────────
  console.log(`${"═".repeat(78)}`);
  console.log(`  BREAK-EVEN AGUA — Precio máximo $/m³ donde ROI = 0%`);
  console.log(`  (Goteo programado, factor riego 1.0)`);
  console.log(`${"═".repeat(78)}\n`);

  const breakEvens = cultivos.map((c) => {
    const r = calcularROI(c, areaM2, 0, 1.0); // costo agua 0 para sacar revenue puro
    return {
      nombre: c.nombre,
      tipo: c.tipo,
      break_even: r.break_even_agua_m3,
      agua_anual: r.agua_anual_m3,
      precio_kg: r.precio_kg,
      plantas: r.plantas,
      productividad: r.productividad_agua_clp_m3,
    };
  });

  breakEvens.sort((a, b) => (b.break_even ?? 0) - (a.break_even ?? 0));

  console.log(
    `  ${pad("Cultivo", 22)} ${pad("Tipo", 10)} ${pad("Break-even", 12, "right")} ${pad("Agua/año", 10, "right")} ${pad("$/kg", 8, "right")} ${pad("Plantas", 8, "right")} ${pad("Prod.agua", 12, "right")}`
  );
  console.log(`  ${"─".repeat(82)}`);

  for (const b of breakEvens) {
    const beStr = b.break_even ? fmtCLP(b.break_even) : "N/A";
    const viable6292 = b.break_even && b.break_even > 6292 ? " ✓ Porter" : "";
    const viable7500 = b.break_even && b.break_even > 7500 ? " ✓ Aljibe" : "";
    const tags = viable7500 || viable6292;
    console.log(
      `  ${pad(b.nombre, 22)} ${pad(b.tipo, 10)} ${pad(beStr, 12, "right")} ${pad(fmt(b.agua_anual) + " m³", 10, "right")} ${pad(fmtCLP(b.precio_kg), 8, "right")} ${pad(fmt(b.plantas), 8, "right")} ${pad(fmtCLP(b.productividad) + "/m³", 12, "right")}${tags}`
    );
  }

  const viablesPorter = breakEvens.filter((b) => b.break_even && b.break_even > 6292);
  const viablesAljibe = breakEvens.filter((b) => b.break_even && b.break_even > 7500);
  console.log(`\n  Viables con Porter ($6,292/m³): ${viablesPorter.length} cultivos`);
  console.log(`  Viables con Aljibe ($7,500/m³): ${viablesAljibe.length} cultivos`);

  // ──────────────────────────────────────────────────────────────────────────
  // SECCIÓN 2: ROI por escenario de agua (goteo programado)
  // ──────────────────────────────────────────────────────────────────────────
  for (const esc of ESCENARIOS_AGUA) {
    const costoM3 = costoAguaEfectivo(esc);

    console.log(`\n${"═".repeat(78)}`);
    console.log(`  ESCENARIO: ${esc.nombre}`);
    console.log(`  Costo efectivo agua: ${fmtCLP(costoM3)}/m³`);
    if (esc.costo_transporte > 0) {
      console.log(`    (Agua: ${fmtCLP(esc.precio_agua_m3)}/m³ + Transporte: ${fmtCLP(esc.costo_transporte)}/${esc.m3_por_viaje}m³ = ${fmtCLP(esc.costo_transporte / esc.m3_por_viaje)}/m³)`);
    }
    console.log(`  Riego: Goteo programado (factor 1.0) | Área: ${(areaM2 / M2_POR_HECTAREA).toFixed(2)} ha`);
    console.log(`${"═".repeat(78)}\n`);

    const resultados: ResultadoROI[] = [];

    for (const c of cultivos) {
      const r = calcularROI(c, areaM2, costoM3, 1.0);
      const viajesMes = esc.m3_por_viaje > 0 ? Math.ceil((r.agua_anual_m3 / 12) / esc.m3_por_viaje) : 0;
      const costoAguaMes = Math.round(r.costo_agua_anual / 12);

      const resultado: ResultadoROI = {
        cultivo: c.nombre,
        tipo: c.tipo,
        escenario_agua: esc.nombre,
        tipo_riego: "programado",
        costo_agua_m3: costoM3,
        viajes_por_mes: viajesMes,
        costo_agua_mensual: costoAguaMes,
        ...r,
      };
      resultados.push(resultado);
      todosResultados.push(resultado);
    }

    resultados.sort((a, b) => b.roi_5a_pct - a.roi_5a_pct);

    const viables = resultados.filter((r) => r.viable);
    const noViables = resultados.filter((r) => !r.viable);

    if (viables.length > 0) {
      console.log(`  VIABLES (${viables.length}):`);
      console.log(
        `  ${pad("Cultivo", 20)} ${pad("ROI 5a", 8, "right")} ${pad("Neto/año", 14, "right")} ${pad("Agua/año", 10, "right")} ${pad("Equil.", 8, "right")} ${pad("Viajes/m", 10, "right")} ${pad("Agua$/mes", 12, "right")}`
      );
      console.log(`  ${"─".repeat(82)}`);
      for (const r of viables) {
        const eqStr = r.punto_equilibrio_meses ? `${r.punto_equilibrio_meses}m` : ">60m";
        console.log(
          `  ${pad(r.cultivo, 20)} ${pad(r.roi_5a_pct + "%", 8, "right")} ${pad(fmtCLP(r.ingreso_neto_anual_estabilizado), 14, "right")} ${pad(fmt(r.agua_anual_m3) + "m³", 10, "right")} ${pad(eqStr, 8, "right")} ${pad(r.viajes_por_mes > 0 ? fmt(r.viajes_por_mes) : "N/A", 10, "right")} ${pad(fmtCLP(r.costo_agua_mensual), 12, "right")}`
        );
      }
    } else {
      console.log(`  ⚠ NINGÚN CULTIVO ES VIABLE con agua a ${fmtCLP(costoM3)}/m³`);
    }

    if (noViables.length > 0) {
      console.log(`\n  NO VIABLES (${noViables.length}):`);
      console.log(
        `  ${pad("Cultivo", 20)} ${pad("ROI 5a", 8, "right")} ${pad("Break-even", 12, "right")} ${pad("Déficit/año", 14, "right")}`
      );
      console.log(`  ${"─".repeat(54)}`);
      for (const r of noViables.slice(0, 10)) {
        const beStr = r.break_even_agua_m3 ? fmtCLP(r.break_even_agua_m3) : "N/A";
        console.log(
          `  ${pad(r.cultivo, 20)} ${pad(r.roi_5a_pct + "%", 8, "right")} ${pad(beStr + "/m³", 12, "right")} ${pad(fmtCLP(r.ingreso_neto_anual_estabilizado), 14, "right")}`
        );
      }
      if (noViables.length > 10) {
        console.log(`  ... y ${noViables.length - 10} más`);
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SECCIÓN 3: Comparativa tipo de riego (top 5 cultivos, escenario Porter)
  // ──────────────────────────────────────────────────────────────────────────
  const costoPorter = costoAguaEfectivo(ESCENARIOS_AGUA[0]);
  const topCultivos = breakEvens
    .filter((b) => b.break_even && b.break_even > costoPorter)
    .slice(0, 5)
    .map((b) => cultivos.find((c) => c.nombre === b.nombre)!)
    .filter(Boolean);

  if (topCultivos.length > 0) {
    console.log(`\n${"═".repeat(78)}`);
    console.log(`  COMPARATIVA TIPO DE RIEGO — Top ${topCultivos.length} cultivos`);
    console.log(`  Escenario: Porter propia (${fmtCLP(costoPorter)}/m³)`);
    console.log(`${"═".repeat(78)}\n`);

    for (const c of topCultivos) {
      console.log(`  ${c.nombre} (${c.tipo}):`);
      for (const riego of TIPOS_RIEGO) {
        const r = calcularROI(c, areaM2, costoPorter, riego.factor);
        const resultado: ResultadoROI = {
          cultivo: c.nombre,
          tipo: c.tipo,
          escenario_agua: "Porter propia",
          tipo_riego: riego.tipo,
          costo_agua_m3: costoPorter,
          viajes_por_mes: ESCENARIOS_AGUA[0].m3_por_viaje > 0
            ? Math.ceil((r.agua_anual_m3 / 12) / ESCENARIOS_AGUA[0].m3_por_viaje)
            : 0,
          costo_agua_mensual: Math.round(r.costo_agua_anual / 12),
          ...r,
        };
        todosResultados.push(resultado);

        const eqStr = r.punto_equilibrio_meses ? `${r.punto_equilibrio_meses}m` : ">60m";
        console.log(
          `    ${pad(riego.nombre, 20)} ROI: ${pad(r.roi_5a_pct + "%", 7, "right")} | Neto/año: ${pad(fmtCLP(r.ingreso_neto_anual_estabilizado), 14, "right")} | Equilibrio: ${eqStr}`
        );
      }
      console.log("");
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SECCIÓN 4: Logística Porter para cultivos viables
  // ──────────────────────────────────────────────────────────────────────────
  if (topCultivos.length > 0) {
    console.log(`${"═".repeat(78)}`);
    console.log(`  LOGÍSTICA PORTER — Viajes y tanques`);
    console.log(`  1.5 m³ por viaje | Diésel: $6,438/viaje | 55km ida-vuelta`);
    console.log(`${"═".repeat(78)}\n`);

    for (const c of topCultivos) {
      const r = calcularROI(c, areaM2, costoPorter, 1.0);
      const consumoSemM3 = r.agua_semanal_m3;
      const consumoMesM3 = r.agua_anual_m3 / 12;

      console.log(`  ${c.nombre}:`);
      console.log(`    Consumo: ${consumoSemM3.toFixed(1)} m³/semana | ${Math.round(consumoMesM3)} m³/mes | ${fmt(r.agua_anual_m3)} m³/año`);

      const tanques = [3, 5, 10, 15, 20];
      for (const tam of tanques) {
        const diasEntreRecargas = consumoSemM3 > 0 ? Math.floor((tam / consumoSemM3) * 7) : 999;
        const recargasMes = consumoMesM3 > 0 ? Math.ceil(consumoMesM3 / tam) : 0;
        const viajesParaLlenar = Math.ceil(tam / 1.5);
        const costoRecarga = viajesParaLlenar * (2000 * 1.5 + 6438); // agua + diesel por viaje
        const costoMes = recargasMes * costoRecarga;
        console.log(
          `    Tanque ${pad(tam + "m³:", 6)} recarga cada ${pad(diasEntreRecargas + "d", 4)} | ${recargasMes} recargas/mes | ${viajesParaLlenar} viajes Porter/recarga | ${fmtCLP(costoMes)}/mes`
        );
      }
      console.log("");
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SECCIÓN 5: Ranking productividad del agua
  // ──────────────────────────────────────────────────────────────────────────
  console.log(`${"═".repeat(78)}`);
  console.log(`  RANKING: PRODUCTIVIDAD DEL AGUA`);
  console.log(`  CLP de ingreso bruto (año 4) por cada m³ de agua consumido`);
  console.log(`${"═".repeat(78)}\n`);

  const ranking = cultivos.map((c) => {
    const r = calcularROI(c, areaM2, 0, 1.0);
    return {
      nombre: c.nombre,
      tipo: c.tipo,
      productividad: r.productividad_agua_clp_m3,
      agua_anual: r.agua_anual_m3,
      ingreso_año4: r.ingreso_año4,
    };
  });
  ranking.sort((a, b) => b.productividad - a.productividad);

  for (let i = 0; i < ranking.length; i++) {
    const r = ranking[i];
    console.log(
      `  ${pad((i + 1) + ".", 4)} ${pad(r.nombre, 22)} ${pad(fmtCLP(r.productividad) + "/m³", 14, "right")} | Ingreso año4: ${pad(fmtCLP(r.ingreso_año4), 14, "right")} | Agua: ${fmt(r.agua_anual)} m³/año`
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SECCIÓN 6: Terrenos recomendados
  // ──────────────────────────────────────────────────────────────────────────
  console.log(`\n${"═".repeat(78)}`);
  console.log(`  TERRENOS RECOMENDADOS PARA SEED`);
  console.log(`  Basado en cultivos viables con agua Porter ($6,292/m³)`);
  console.log(`${"═".repeat(78)}\n`);

  const viablesData = topCultivos.map((c) => {
    const r = calcularROI(c, areaM2, costoPorter, 1.0);
    return { cultivo: c, roi: r };
  });

  if (viablesData.length >= 2) {
    console.log(`  Idea 1: "Alto Valor" — Los 2 mejores cultivos juntos`);
    const top2 = viablesData.slice(0, 2);
    for (const d of top2) {
      console.log(`    ${d.cultivo.nombre}: ROI ${d.roi.roi_5a_pct}% | ${fmt(d.roi.plantas)} plantas | ${fmt(d.roi.agua_anual_m3)} m³/año`);
    }
    const totalAgua = top2.reduce((sum, d) => sum + d.roi.agua_anual_m3, 0);
    const totalNeto = top2.reduce((sum, d) => sum + d.roi.ingreso_neto_anual_estabilizado, 0);
    console.log(`    Total agua: ${fmt(totalAgua)} m³/año | Neto combinado: ${fmtCLP(totalNeto)}/año\n`);
  }

  if (viablesData.length >= 3) {
    console.log(`  Idea 2: "Diversificado" — 3+ cultivos viables`);
    const top3 = viablesData.slice(0, 3);
    for (const d of top3) {
      console.log(`    ${d.cultivo.nombre}: ROI ${d.roi.roi_5a_pct}% | Neto: ${fmtCLP(d.roi.ingreso_neto_anual_estabilizado)}/año`);
    }
    console.log("");
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Export JSON
  // ──────────────────────────────────────────────────────────────────────────
  if (exportJson) {
    const outPath = resolve(ROOT, "scripts/data/resultados-roi.json");
    writeFileSync(outPath, JSON.stringify(todosResultados, null, 2), "utf-8");
    console.log(`\n  Resultados exportados a: ${outPath}`);
  }

  console.log(`\n${"═".repeat(78)}`);
  console.log(`  FIN DEL ANÁLISIS`);
  console.log(`${"═".repeat(78)}\n`);
}

main();
