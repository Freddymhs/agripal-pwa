/**
 * audit-roi.mts — Consulta BD y verifica cálculos ROI para auditoría.
 * Lee datos desde datos JSONB (la fuente real del catálogo).
 * Uso: npx tsx scripts/audit-roi.mts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const M2_POR_HECTAREA = 10_000;
const SEMANAS_POR_AÑO = 52;
const PRECIO_PLANTA_FACTOR = 0.5;
const AÑOS_AMORTIZACION = 5;
const LITROS_POR_M3 = 1000;
const KC_ADULTA: Record<string, number> = {
  tuna: 0.35, pitahaya: 0.4, higuera: 0.65, granada: 0.65, olivo: 0.65,
  "dátil medjool": 0.9, guayaba: 0.85, "guayaba rosada": 0.85, maracuyá: 1.0,
  "uva de mesa primor": 0.7, "arándano en maceta": 0.9, lúcuma: 0.7,
  "zapote blanco": 0.7, algarrobo: 0.5, limón: 0.7, "mandarina w. murcott": 0.7,
  "tomate cherry": 1.15, "ají/pimiento": 1.1, "choclo (maíz dulce)": 1.15,
  orégano: 0.7, ajo: 1.0, cebolla: 1.05, zapallo: 1.0, camote: 1.1,
  romero: 0.5, quinoa: 1.0, mango: 1.1,
};
function getKcAdulta(nombre: string): number {
  return KC_ADULTA[nombre.toLowerCase()] ?? 0.8;
}

const FACTOR_EFICIENCIA: Record<string, number> = {
  programado: 1.0,
  manual_sesiones: 0.9,
  continuo_24_7: 0.85,
  manual_balde: 0.8,
};

async function run() {
  const { data: proyectos } = await supabase.from("proyectos").select("*");
  if (!proyectos?.length) { console.log("No projects"); return; }
  const proyecto = proyectos[0];
  console.log(`Proyecto: ${proyecto.nombre}\n`);

  const { data: terrenos } = await supabase.from("terrenos").select("*").eq("proyecto_id", proyecto.id).order("created_at", { ascending: false });
  const terrenoIds = terrenos!.map((t: any) => t.id);
  const { data: zonas } = await supabase.from("zonas").select("*").in("terreno_id", terrenoIds);
  const zonaIds = zonas!.map((z: any) => z.id);

  let allPlantas: any[] = [];
  for (let i = 0; i < zonaIds.length; i += 50) {
    const { data } = await supabase.from("plantas").select("*").in("zona_id", zonaIds.slice(i, i + 50));
    if (data) allPlantas = allPlantas.concat(data);
  }

  const { data: catalogo } = await supabase.from("catalogo_cultivos").select("*").eq("proyecto_id", proyecto.id);

  console.log(`Terrenos: ${terrenos!.length} | Zonas: ${zonas!.length} | Plantas: ${allPlantas.length} | Catálogo: ${catalogo!.length}`);
  console.log("=".repeat(130));

  const resumenTerrenos: any[] = [];

  for (const terreno of terrenos!) {
    const zonasTerreno = zonas!.filter((z: any) => z.terreno_id === terreno.id);
    const estanques = zonasTerreno.filter((z: any) => z.tipo === "estanque" && z.datos?.estanque_config);
    const zonasCultivo = zonasTerreno.filter((z: any) => z.tipo === "cultivo");

    let costoAguaM3 = 0;
    const costosAgua: number[] = [];
    for (const est of estanques) {
      const ec = est.datos?.estanque_config;
      // Proveedor price (primary) + transport cost (additive)
      const proveedorId = ec?.proveedor_id;
      const terrenoDeEst = terrenos!.find((t: any) => t.id === est.terreno_id);
      const proveedoresTerreno: any[] = terrenoDeEst?.datos?.agua_avanzada?.proveedores ?? [];
      const proveedor = proveedorId ? proveedoresTerreno.find((p: any) => p.id === proveedorId) : null;
      const precioAgua = proveedor?.precio_m3_clp ?? 0;
      const costoTransporte = (ec?.recarga?.costo_transporte_clp && ec?.recarga?.cantidad_litros > 0)
        ? ec.recarga.costo_transporte_clp / (ec.recarga.cantidad_litros / LITROS_POR_M3)
        : 0;
      const costoTotal = precioAgua + costoTransporte;
      if (costoTotal > 0) {
        costosAgua.push(costoTotal);
      } else if (ec?.costo_por_m3) {
        costosAgua.push(ec.costo_por_m3);
      }
    }
    if (costosAgua.length > 0) costoAguaM3 = costosAgua.reduce((a, b) => a + b, 0) / costosAgua.length;

    const anchoM = terreno.ancho_m ?? terreno.datos?.ancho_m ?? "?";
    const altoM = terreno.alto_m ?? terreno.datos?.alto_m ?? "?";

    console.log(`\n${"─".repeat(130)}`);
    console.log(`TERRENO: ${terreno.nombre} (${anchoM}×${altoM}m) | Agua: $${Math.round(costoAguaM3)}/m³`);

    if (zonasCultivo.length === 0) { console.log("  Sin zonas cultivo"); continue; }

    let totalInversion = 0;
    let totalMargen = 0;

    for (const zona of zonasCultivo) {
      const plantasZona = allPlantas.filter((p: any) => p.zona_id === zona.id && p.estado !== "muerta");
      if (plantasZona.length === 0) continue;

      const porCultivo: Record<string, any[]> = {};
      for (const p of plantasZona) {
        if (!porCultivo[p.tipo_cultivo_id]) porCultivo[p.tipo_cultivo_id] = [];
        porCultivo[p.tipo_cultivo_id].push(p);
      }

      const configRiego = zona.datos?.configuracion_riego;
      const tipoRiego = configRiego?.tipo ?? "sin_config";
      const factorRiego = FACTOR_EFICIENCIA[tipoRiego] ?? 1.0;
      const esManual = tipoRiego === "manual_balde" || tipoRiego === "manual_sesiones";

      for (const [cultivoId, plantasCultivo] of Object.entries(porCultivo)) {
        const cultivo = catalogo!.find((c: any) => c.id === cultivoId);
        if (!cultivo) continue;

        const numPlantas = (plantasCultivo as any[]).length;

        // Read from datos JSONB
        const d = cultivo.datos || {};
        const espaciado = d.espaciado_recomendado_m ?? 3;
        const precioMin = d.precio_kg_min_clp ?? 0;
        const precioMax = d.precio_kg_max_clp ?? 0;
        const precioKg = (precioMin + precioMax) / 2;
        const precioPlanta = d.precio_planta_clp ?? (precioKg * PRECIO_PLANTA_FACTOR);
        const aguaMin = d.agua_m3_ha_año_min ?? 0;
        const aguaMax = d.agua_m3_ha_año_max ?? 0;
        const aguaPromHaAño = (aguaMin + aguaMax) / 2;
        const tiempoProduccion = d.tiempo_produccion_meses ?? 12;
        const prod = d.produccion || {};

        const plantasPorHa = M2_POR_HECTAREA / (espaciado ** 2);
        const factorArea = plantasPorHa > 0 ? numPlantas / plantasPorHa : 0;
        const costoPlantasTotal = numPlantas * precioPlanta;

        // Water consumption
        const aguaPorPlantaAño = plantasPorHa > 0 ? aguaPromHaAño / plantasPorHa : 0;
        const aguaPorPlantaSemana = aguaPorPlantaAño / SEMANAS_POR_AÑO;

        let consumoSemanalM3: number;
        let consumoNota = "";
        if (esManual && configRiego?.litros_por_planta > 0 && configRiego?.frecuencia_dias > 0) {
          const litrosPorPlantaSemana = configRiego.litros_por_planta * (7 / configRiego.frecuencia_dias);
          consumoSemanalM3 = (numPlantas * litrosPorPlantaSemana) / LITROS_POR_M3;
          consumoNota = `(manual: ${configRiego.litros_por_planta}L cada ${configRiego.frecuencia_dias}d)`;
        } else {
          const kc = getKcAdulta(cultivo.nombre);
          consumoSemanalM3 = numPlantas * aguaPorPlantaSemana * kc;
          consumoNota = `(teórico Kc=${kc})`;
        }

        const aguaAnualM3 = consumoSemanalM3 * SEMANAS_POR_AÑO;
        const costoAguaAnual = aguaAnualM3 * costoAguaM3;
        const inversion = costoPlantasTotal + costoAguaAnual;

        // Production
        const fraccionAño1 = Math.max(0, Math.min(1, (12 - tiempoProduccion) / 12));
        const p2 = prod.produccion_kg_ha_año2 ?? 0;
        const p1 = p2 * fraccionAño1 * 0.5;
        const p3 = prod.produccion_kg_ha_año3 ?? 0;
        const p4 = prod.produccion_kg_ha_año4 ?? 0;
        const p5 = p4;

        const kgAnuales = [p1, p2, p3, p4, p5].map(p => p * factorArea * factorRiego);
        const ingresosBrutos = kgAnuales.map(k => k * precioKg);
        const ingresoTotal5a = ingresosBrutos.reduce((a, b) => a + b, 0);

        const costoAnualOp = costoAguaAnual + costoPlantasTotal / AÑOS_AMORTIZACION;
        const netosAnuales = ingresosBrutos.map(i => i - costoAnualOp);
        const margenBruto = netosAnuales.reduce((a, b) => a + b, 0);

        // ROI corregido (margen / inversión)
        const roi = inversion > 0 ? (margenBruto / inversion) * 100 : 0;

        const costoAgua5a = costoAguaAnual * 5;
        const ratioRevenueWater = costoAgua5a > 0 ? ingresoTotal5a / costoAgua5a : Infinity;

        totalInversion += inversion;
        totalMargen += margenBruto;

        // Etapas
        const etapas: Record<string, number> = {};
        for (const p of plantasCultivo as any[]) {
          const e = p.etapa_actual || "adulta";
          etapas[e] = (etapas[e] || 0) + 1;
        }

        console.log(`\n  ${cultivo.nombre} en ${zona.nombre} | ${tipoRiego} ef${factorRiego * 100}% | ${numPlantas} pl`);
        console.log(`     Espaciado: ${espaciado}m | ${Math.round(plantasPorHa)} pl/ha | factorArea: ${factorArea.toFixed(4)} | Etapas: ${JSON.stringify(etapas)}`);
        console.log(`     Precio: $${precioKg}/kg (${precioMin}-${precioMax}) | Planta: $${precioPlanta}`);
        console.log(`     Agua: ${aguaMin}-${aguaMax} m³/ha/año | Consumo: ${consumoSemanalM3.toFixed(3)} m³/sem ${consumoNota} | Anual: ${Math.round(aguaAnualM3)} m³`);
        console.log(`     Inversión: plantas $${Math.round(costoPlantasTotal)} + agua $${Math.round(costoAguaAnual)} = $${Math.round(inversion)}`);
        console.log(`     Prod kg/ha: ${[p1, p2, p3, p4, p5].map(p => Math.round(p)).join(" → ")} (tiempo: ${tiempoProduccion}m)`);
        console.log(`     Ingresos brutos 5a: $${Math.round(ingresoTotal5a)} | CostoAnualOp: $${Math.round(costoAnualOp)}`);
        console.log(`     Margen Bruto 5a: $${Math.round(margenBruto)}`);
        console.log(`     ROI: ${Math.round(roi)}%`);
        console.log(`     Revenue/Water: ${ratioRevenueWater === Infinity ? "∞" : ratioRevenueWater.toFixed(2) + "x"}`);
      }
    }

    if (totalInversion > 0) {
      const roiGlobal = (totalMargen / totalInversion) * 100;
      resumenTerrenos.push({ nombre: terreno.nombre, inv: totalInversion, margen: totalMargen, roi: Math.round(roiGlobal) });
      console.log(`\n  TOTAL: Inv $${Math.round(totalInversion)} | Margen $${Math.round(totalMargen)} | ROI: ${Math.round(roiGlobal)}%`);
    }
  }

  console.log("\n\n" + "=".repeat(130));
  console.log("RESUMEN");
  console.log("=".repeat(130));
  console.log("Terreno".padEnd(40) + "Inversión".padStart(14) + "Margen 5a".padStart(14) + "ROI".padStart(10));
  console.log("─".repeat(78));
  for (const r of resumenTerrenos) {
    console.log(
      r.nombre.padEnd(40) +
      `$${Math.round(r.inv)}`.padStart(14) +
      `$${Math.round(r.margen)}`.padStart(14) +
      `${r.roi}%`.padStart(10)
    );
  }
}

run().catch(console.error);
