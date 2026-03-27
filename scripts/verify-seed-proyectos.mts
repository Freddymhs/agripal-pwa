/**
 * verify-seed-proyectos.mts
 * Compara campo a campo los proyectos en Supabase contra las definiciones
 * de los seed scripts. Garantiza que re-ejecutar los seeds produce el mismo resultado.
 *
 * Uso:
 *   npx tsx scripts/verify-seed-proyectos.mts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

import {
  TERRENOS as TERRENOS_PORTERO,
  PORTER_COSTO_EFECTIVO_M3,
  MARGEN_BORDE as MARGEN_PORTERO,
  MAX_PLANTAS_POR_ZONA as MAX_PORTERO,
} from "./seed-proyecto-portero.mjs";

import {
  TERRENOS as TERRENOS_EXPERTA,
  MARGEN_BORDE as MARGEN_EXPERTA,
  MAX_PLANTAS_POR_ZONA as MAX_EXPERTA,
} from "./seed-terrenos-ia-experta.mjs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// ─── Contadores globales ─────────────────────────────────────────────────────

let totalChecks = 0;
let totalErrores = 0;

function check(campo: string, esperado: unknown, actual: unknown, ctx: string): boolean {
  totalChecks++;
  const ok = JSON.stringify(esperado) === JSON.stringify(actual);
  if (!ok) {
    totalErrores++;
    console.log(`    ❌ ${campo}`);
    console.log(`       esperado: ${JSON.stringify(esperado)}`);
    console.log(`       actual:   ${JSON.stringify(actual)}`);
  }
  return ok;
}

function calcCostoEfectivo(precio: number, transporte: number, litros: number): number {
  return transporte > 0 && litros > 0
    ? precio + transporte / (litros / 1000)
    : precio;
}

function calcPlantasEsperadas(anchoZona: number, altoZona: number, espaciado: number, margen: number, maxPlantas: number): number {
  const anchoDisp = anchoZona - margen * 2;
  const altoDisp  = altoZona  - margen * 2;
  if (anchoDisp <= 0 || altoDisp <= 0) return 0;
  const cols  = Math.floor(anchoDisp / espaciado) + 1;
  const filas = Math.floor(altoDisp  / espaciado) + 1;
  return Math.min(cols * filas, maxPlantas);
}

// ─── Verificador genérico de proyecto ────────────────────────────────────────

async function verificarProyecto(config: {
  busqueda: string;
  terrenos: typeof TERRENOS_PORTERO | typeof TERRENOS_EXPERTA;
  costoFn: (tDef: (typeof TERRENOS_PORTERO)[0]) => number;
  aguaFuenteFn: (tDef: (typeof TERRENOS_PORTERO)[0]) => string;
  margen: number;
  maxPlantas: number;
}) {
  console.log(`\n${"═".repeat(80)}`);
  console.log(`PROYECTO: "${config.busqueda}"`);
  console.log(`${"═".repeat(80)}`);

  const { data: rows } = await supabase
    .from("proyectos")
    .select("id, nombre")
    .ilike("nombre", `%${config.busqueda}%`)
    .order("created_at", { ascending: false })
    .limit(1);

  const proyecto = rows?.[0];
  if (!proyecto) {
    console.log(`  ❌ Proyecto NO encontrado en Supabase`);
    totalErrores++;
    return;
  }
  console.log(`  ✅ "${proyecto.nombre}" (${proyecto.id.slice(0, 8)}...)`);

  // Catálogo del proyecto para resolver cultivo_base_id
  const { data: catalogo } = await supabase
    .from("catalogo_cultivos")
    .select("id, cultivo_base_id, datos")
    .eq("proyecto_id", proyecto.id);
  const catById = new Map((catalogo ?? []).map((c) => [c.id, c]));

  const { data: terrenosDB } = await supabase
    .from("terrenos")
    .select("id, nombre, ancho_m, alto_m, datos")
    .eq("proyecto_id", proyecto.id)
    .order("created_at");

  let terrenosOk = 0;

  for (const tDef of config.terrenos as (typeof TERRENOS_PORTERO)[0][]) {
    console.log(`\n  ── TERRENO: "${tDef.nombre}" ──`);

    const tDB = (terrenosDB ?? []).find((t) => t.nombre === tDef.nombre);
    if (!tDB) {
      console.log(`    ❌ NO encontrado en Supabase`);
      totalErrores++;
      continue;
    }

    const d   = tDB.datos as Record<string, unknown>;
    const ctx = tDef.nombre;
    const costoEsperado   = config.costoFn(tDef);
    const fuenteEsperada  = config.aguaFuenteFn(tDef);

    // Dimensiones
    check("ancho_m", tDef.ancho_m, tDB.ancho_m, ctx);
    check("alto_m",  tDef.alto_m,  tDB.alto_m,  ctx);

    // Agua terreno
    check("agua_fuente",          fuenteEsperada,            d["agua_fuente"],          ctx);
    check("agua_costo_clp_por_m3", costoEsperado,            d["agua_costo_clp_por_m3"], ctx);
    check("agua_confiabilidad",   tDef.agua.confiabilidad,   d["agua_confiabilidad"],   ctx);

    // Proveedor
    const provs = ((d["agua_avanzada"] as Record<string, unknown>)?.["proveedores"] as Record<string, unknown>[]) ?? [];
    const prov  = provs[0];
    const aguaDef = tDef.agua as unknown as Record<string, unknown>;
    const nombreProvEsperado = (aguaDef["nombre_proveedor"] as string | undefined) ?? "Porter Propia (1.5m³/viaje)";
    check("proveedor.nombre",       nombreProvEsperado,          prov?.["nombre"],          ctx);
    check("proveedor.precio_m3_clp", tDef.agua.precio_m3_clp,   prov?.["precio_m3_clp"],   ctx);

    // Calidad agua
    const calDB  = ((d["agua_avanzada"] as Record<string, unknown>)?.["calidad"] as Record<string, unknown>) ?? {};
    check("calidad.salinidad_dS_m", tDef.agua.calidad.salinidad_dS_m, calDB["salinidad_dS_m"], ctx);
    check("calidad.boro_ppm",        tDef.agua.calidad.boro_ppm,       calDB["boro_ppm"],       ctx);
    check("calidad.arsenico_mg_l",   tDef.agua.calidad.arsenico_mg_l,  calDB["arsenico_mg_l"],  ctx);

    // Suelo
    const sDB = (d["suelo"] as Record<string, Record<string, unknown>>) ?? {};
    check("suelo.ph",             tDef.suelo.fisico.ph,             sDB["fisico"]?.["ph"],             ctx);
    check("suelo.textura",        tDef.suelo.fisico.textura,        sDB["fisico"]?.["textura"],        ctx);
    check("suelo.drenaje",        tDef.suelo.fisico.drenaje,        sDB["fisico"]?.["drenaje"],        ctx);
    check("suelo.materia_org",    tDef.suelo.fisico.materia_organica_pct, sDB["fisico"]?.["materia_organica_pct"], ctx);
    check("suelo.salinidad_dS_m", tDef.suelo.quimico.salinidad_dS_m, sDB["quimico"]?.["salinidad_dS_m"], ctx);
    check("suelo.boro_mg_l",      tDef.suelo.quimico.boro_mg_l,     sDB["quimico"]?.["boro_mg_l"],     ctx);

    // Zonas del terreno en BD
    const { data: zonasDB } = await supabase
      .from("zonas")
      .select("id, nombre, tipo, x, y, ancho, alto, datos")
      .eq("terreno_id", tDB.id)
      .order("created_at");

    // ── Estanques ──────────────────────────────────────────────────────────
    const estanquesDef: Record<string, unknown>[] =
      (tDef as unknown as Record<string, unknown>)["estanques"]
        ? ((tDef as unknown as Record<string, unknown>)["estanques"] as Record<string, unknown>[])
        : [(tDef as unknown as Record<string, unknown>)["estanque"] as Record<string, unknown>];

    for (const eDef of estanquesDef) {
      const eDB = (zonasDB ?? []).find((z) => z.tipo === "estanque" && z.nombre === eDef["nombre"]);
      const eCtx = `${ctx} › estanque "${eDef["nombre"]}"`;

      if (!eDB) {
        console.log(`    ❌ Estanque "${eDef["nombre"]}" NO encontrado`);
        totalErrores++;
        continue;
      }

      check("estanque.x",    eDef["x"],    eDB.x,    eCtx);
      check("estanque.y",    eDef["y"],    eDB.y,    eCtx);
      check("estanque.ancho", eDef["ancho"], eDB.ancho, eCtx);
      check("estanque.alto",  eDef["alto"],  eDB.alto,  eCtx);

      const ec = ((eDB.datos as Record<string, unknown>)?.["estanque_config"] as Record<string, unknown>) ?? {};
      const capEsperada = (eDef["capacidad_m3"] as number | undefined)
        ?? ((eDef["capacidad_litros"] as number) / 1000);
      check("estanque.capacidad_m3",  capEsperada,                    ec["capacidad_m3"],  eCtx);
      check("estanque.material",      eDef["material"] ?? "plastico", ec["material"],      eCtx);
      check("estanque.tiene_tapa",    eDef["tiene_tapa"] ?? true,     ec["tiene_tapa"],    eCtx);
      check("estanque.tiene_filtro",  eDef["tiene_filtro"] ?? false,  ec["tiene_filtro"],  eCtx);
      check("estanque.costo_por_m3",  costoEsperado,                  ec["costo_por_m3"],  eCtx);

      const recDB  = (ec["recarga"] as Record<string, unknown>) ?? {};
      const recDef = tDef.agua.recarga;
      check("estanque.recarga.frecuencia_dias",     recDef.frecuencia_dias,     recDB["frecuencia_dias"],     eCtx);
      check("estanque.recarga.cantidad_litros",     recDef.cantidad_litros,     recDB["cantidad_litros"],     eCtx);
      check("estanque.recarga.costo_transporte_clp", recDef.costo_transporte_clp, recDB["costo_transporte_clp"], eCtx);
    }

    // ── Zonas cultivo ──────────────────────────────────────────────────────
    const zonasDef = (tDef as unknown as Record<string, unknown>)["zonas"] as Record<string, unknown>[];

    for (const zDef of zonasDef) {
      const zDB = (zonasDB ?? []).find((z) => z.tipo === "cultivo" && z.nombre === zDef["nombre"]);
      const zCtx = `${ctx} › zona "${zDef["nombre"]}"`;

      if (!zDB) {
        console.log(`    ❌ Zona "${zDef["nombre"]}" NO encontrada`);
        totalErrores++;
        continue;
      }

      check("zona.x",    zDef["x"],    zDB.x,    zCtx);
      check("zona.y",    zDef["y"],    zDB.y,    zCtx);
      check("zona.ancho", zDef["ancho"], zDB.ancho, zCtx);
      check("zona.alto",  zDef["alto"],  zDB.alto,  zCtx);

      const rDB  = ((zDB.datos as Record<string, unknown>)?.["configuracion_riego"] as Record<string, unknown>) ?? {};
      const rDef = zDef["riego"] as Record<string, unknown>;
      check("zona.riego.tipo",           rDef["tipo"],           rDB["tipo"],           zCtx);
      check("zona.riego.caudal_total_lh", rDef["caudal_total_lh"], rDB["caudal_total_lh"], zCtx);
      check("zona.riego.horas_dia",      rDef["horas_dia"],      rDB["horas_dia"],      zCtx);

      // Planta de muestra para cultivo_base_id y fecha
      const { data: muestra } = await supabase
        .from("plantas")
        .select("tipo_cultivo_id, datos")
        .eq("zona_id", zDB.id)
        .limit(1)
        .single();

      if (!muestra) {
        console.log(`    ❌ Sin plantas en zona "${zDef["nombre"]}"`);
        totalErrores++;
        continue;
      }

      const cc = catById.get(muestra.tipo_cultivo_id);
      check("zona.cultivo_base_id",  zDef["cultivo_base_id"],  cc?.cultivo_base_id,  zCtx);
      check("zona.fecha_plantacion", zDef["fecha_plantacion"],
        (muestra.datos as Record<string, unknown>)?.["fecha_plantacion"], zCtx);

      // Conteo plantas
      const { count: plantCount } = await supabase
        .from("plantas")
        .select("*", { count: "exact", head: true })
        .eq("zona_id", zDB.id);

      const espaciado = ((cc?.datos as Record<string, unknown>)?.["espaciado_recomendado_m"] as number) ?? 1;
      const plantasEsperadas = calcPlantasEsperadas(
        zDef["ancho"] as number,
        zDef["alto"]  as number,
        espaciado,
        config.margen,
        config.maxPlantas,
      );
      check("zona.plantas_count", plantasEsperadas, plantCount, zCtx);
    }

    terrenosOk++;
    console.log(`    ✅ terreno ok`);
  }

  console.log(`\n  TERRENOS: ${terrenosOk}/${config.terrenos.length} sin errores`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  console.log("Verificando seeds vs Supabase...\n");

  await verificarProyecto({
    busqueda: "Portero",
    terrenos: TERRENOS_PORTERO as never,
    costoFn:  () => PORTER_COSTO_EFECTIVO_M3,
    aguaFuenteFn: () => "aljibe",   // hardcodeado en el seed
    margen:    MARGEN_PORTERO,
    maxPlantas: MAX_PORTERO,
  });

  await verificarProyecto({
    busqueda: "Estanquero",
    terrenos: TERRENOS_EXPERTA as never,
    costoFn:  (tDef) => {
      const a = (tDef as unknown as { agua: { precio_m3_clp: number; recarga: { costo_transporte_clp: number; cantidad_litros: number } } }).agua;
      return calcCostoEfectivo(a.precio_m3_clp, a.recarga.costo_transporte_clp, a.recarga.cantidad_litros);
    },
    aguaFuenteFn: (tDef) => {
      const fuente = ((tDef as unknown as { agua: { fuente: string } }).agua.fuente);
      return fuente === "riego" ? "aljibe" : fuente;
    },
    margen:    MARGEN_EXPERTA,
    maxPlantas: MAX_EXPERTA,
  });

  console.log(`\n${"═".repeat(80)}`);
  const ok = totalErrores === 0;
  console.log(`RESULTADO FINAL: ${totalChecks} checks — ${ok ? "✅ TODO COINCIDE 100%" : `❌ ${totalErrores} errores`}`);
  console.log(`${"═".repeat(80)}\n`);
  process.exit(ok ? 0 : 1);
}

run().catch(console.error);
