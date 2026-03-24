/**
 * Backfill precios_historico con datos ODEPA 2025
 *
 * Flujo:
 * 1. Obtiene resource_id del año 2025 via package_show
 * 2. Pagina datastore_search con filtro Region = "Región de Arica y Parinacota"
 * 3. Convierte precio por unidad comercial → CLP/kg
 * 4. Inserta en precios_historico via Supabase
 *
 * Uso:
 *   npx tsx scripts/backfill-odepa-2025.mts              # ejecuta e inserta en BD
 *   npx tsx scripts/backfill-odepa-2025.mts --dry-run     # solo guarda JSON local
 *   npx tsx scripts/backfill-odepa-2025.mts --all-regions  # todas las regiones (no solo Arica)
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "node:fs";

// ─── Config ─────────────────────────────────────────────────────────
const ODEPA_BASE = "https://datos.odepa.gob.cl/api/3/action";
const PACKAGE_ID = "precios-mayoristas-de-frutas-y-hortalizas";
const PAGE_SIZE = 1000;
const REGION_ARICA = "Región de Arica y Parinacota";
const YEAR = 2025;

const DRY_RUN = process.argv.includes("--dry-run");
const ALL_REGIONS = process.argv.includes("--all-regions");

// ─── ODEPA types ────────────────────────────────────────────────────
interface OdepaCkanRecord {
  Fecha: string;
  Region: string;
  Mercado: string;
  Producto: string;
  "Precio minimo": string;
  "Precio maximo": string;
  "Precio promedio ponderado": string;
  "Unidad de comercializacion": string;
}

interface HistoricoRow {
  nombre_odepa: string;
  region: string;
  mercado: string | null;
  fecha_odepa: string;
  precio_min_clp: number;
  precio_max_clp: number;
  precio_actual_clp: number;
  precio_kg_clp: number | null;
  unidad_comercializacion: string | null;
  precio_mayorista_id: string | null;
  fuente: string;
}

// ─── Helpers ────────────────────────────────────────────────────────

function parseKgDesdeUnidad(unidad: string | undefined | null): number | null {
  if (!unidad) return null;
  const match = unidad.match(
    /(\d+(?:[.,]\d+)?)\s*(?:a\s*\d+(?:[.,]\d+)?\s*)?kilog?r?a?m?o?s?/i,
  );
  if (!match) return null;
  const kg = parseFloat(match[1].replace(",", "."));
  return isNaN(kg) || kg <= 0 ? null : kg;
}

function parseDecimal(value: string | number | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  const cleaned = value.replace(/[^\d.,-]/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// ─── Step 1: Get resource_id ────────────────────────────────────────

async function getResourceId(year: number): Promise<string | null> {
  console.log(`Buscando resource_id para año ${year}...`);
  const res = await fetch(`${ODEPA_BASE}/package_show?id=${PACKAGE_ID}`);
  const json = (await res.json()) as {
    success: boolean;
    result: { resources: Array<{ id: string; name: string }> };
  };

  if (!json.success) {
    console.error("package_show falló");
    return null;
  }

  for (const resource of json.result.resources) {
    const match = resource.name.match(/(\d{4})/);
    if (match && Number(match[1]) === year) {
      console.log(`  resource_id: ${resource.id} (${resource.name})`);
      return resource.id;
    }
  }

  console.log("  Recursos disponibles:");
  for (const r of json.result.resources) {
    console.log(`    - ${r.name} → ${r.id}`);
  }
  return null;
}

// ─── Step 2: Fetch all records ──────────────────────────────────────

async function fetchAllRecords(
  resourceId: string,
  region: string | null,
): Promise<OdepaCkanRecord[]> {
  const results: OdepaCkanRecord[] = [];
  let offset = 0;
  let total = 0;

  console.log(
    `Descargando registros${region ? ` para ${region}` : " (todas las regiones)"}...`,
  );

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const params = new URLSearchParams({
      resource_id: resourceId,
      limit: String(PAGE_SIZE),
      offset: String(offset),
    });

    if (region) {
      params.set("filters", JSON.stringify({ Region: region }));
    }

    const url = `${ODEPA_BASE}/datastore_search?${params.toString()}`;
    const res = await fetch(url);
    const json = (await res.json()) as {
      success: boolean;
      result: { records: OdepaCkanRecord[]; total: number };
    };

    if (!json.success || json.result.records.length === 0) break;

    if (offset === 0) {
      total = json.result.total;
      console.log(`  Total registros en ODEPA: ${total}`);
    }

    results.push(...json.result.records);
    offset += PAGE_SIZE;

    process.stdout.write(`  Descargados: ${results.length}/${total}\r`);

    if (json.result.records.length < PAGE_SIZE) break;
  }

  console.log(`\n  Total descargados: ${results.length}`);
  return results;
}

// ─── Step 3: Transform ──────────────────────────────────────────────

function transformRecords(
  records: OdepaCkanRecord[],
  preciosMap: Map<string, string>,
): HistoricoRow[] {
  return records.map((r) => {
    const unidad = r["Unidad de comercializacion"] || null;
    const kgPorUnidad = parseKgDesdeUnidad(unidad);
    const precioPromedio = parseDecimal(r["Precio promedio ponderado"]);
    const precioKg =
      kgPorUnidad && kgPorUnidad > 0
        ? Math.round(precioPromedio / kgPorUnidad)
        : null;

    const nombreNorm = r.Producto.trim();
    const precioMayoristaId = preciosMap.get(nombreNorm) ?? null;

    return {
      nombre_odepa: nombreNorm,
      region: r.Region,
      mercado: r.Mercado || null,
      fecha_odepa: r.Fecha.split("T")[0],
      precio_min_clp: parseDecimal(r["Precio minimo"]),
      precio_max_clp: parseDecimal(r["Precio maximo"]),
      precio_actual_clp: Math.round(precioPromedio),
      precio_kg_clp: precioKg,
      unidad_comercializacion: unidad,
      precio_mayorista_id: precioMayoristaId,
      fuente: "odepa",
    };
  });
}

// ─── Step 4: Insert ─────────────────────────────────────────────────

async function insertBatch(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- standalone script, no generated DB types
  supabase: any,
  rows: HistoricoRow[],
): Promise<number> {
  const BATCH_SIZE = 500;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("precios_historico").insert(batch);

    if (error) {
      console.error(`  Error en batch ${i}-${i + batch.length}: ${error.message}`);
    } else {
      inserted += batch.length;
    }

    process.stdout.write(`  Insertados: ${inserted}/${rows.length}\r`);
  }

  console.log(`\n  Total insertados: ${inserted}`);
  return inserted;
}

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  console.log(`\n=== Backfill ODEPA ${YEAR} ===`);
  console.log(`Modo: ${DRY_RUN ? "DRY-RUN (solo JSON)" : "INSERTAR EN BD"}`);
  console.log(`Regiones: ${ALL_REGIONS ? "TODAS" : REGION_ARICA}\n`);

  // 1. Resource ID
  const resourceId = await getResourceId(YEAR);
  if (!resourceId) {
    console.error(`No se encontró resource para ${YEAR}. Abortando.`);
    process.exit(1);
  }

  // 2. Fetch
  const region = ALL_REGIONS ? null : REGION_ARICA;
  const records = await fetchAllRecords(resourceId, region);
  if (records.length === 0) {
    console.log("No se encontraron registros. Abortando.");
    process.exit(0);
  }

  // 3. Get precios_actual map para vincular
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Map nombre_odepa → precios_actual.id
  const { data: preciosMayoristas } = await supabase
    .from("precios_actual")
    .select("id, nombre_odepa")
    .not("nombre_odepa", "is", null);

  const preciosMap = new Map<string, string>();
  for (const pm of preciosMayoristas ?? []) {
    if (pm.nombre_odepa) {
      preciosMap.set(pm.nombre_odepa, pm.id);
    }
  }
  console.log(`\nPrecios mayoristas con nombre_odepa: ${preciosMap.size}`);

  // 4. Transform
  const rows = transformRecords(records, preciosMap);

  // Stats
  const conKg = rows.filter((r) => r.precio_kg_clp !== null).length;
  const sinKg = rows.length - conKg;
  const conMatch = rows.filter((r) => r.precio_mayorista_id !== null).length;
  const productos = new Set(rows.map((r) => r.nombre_odepa));

  console.log(`\nResumen:`);
  console.log(`  Registros: ${rows.length}`);
  console.log(`  Productos únicos: ${productos.size}`);
  console.log(`  Con precio_kg_clp: ${conKg} | Sin: ${sinKg}`);
  console.log(`  Con match precios_actual: ${conMatch}`);

  if (DRY_RUN) {
    const outPath = `scripts/data/odepa-${YEAR}-backfill.json`;
    fs.mkdirSync("scripts/data", { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(rows, null, 2));
    console.log(`\nGuardado en ${outPath}`);

    // También guardar resumen por producto
    const resumen = [...productos].sort().map((nombre) => {
      const prod = rows.filter((r) => r.nombre_odepa === nombre);
      const fechas = prod.map((r) => r.fecha_odepa).sort();
      return {
        nombre,
        registros: prod.length,
        fecha_min: fechas[0],
        fecha_max: fechas[fechas.length - 1],
        precio_kg_promedio: prod
          .filter((r) => r.precio_kg_clp !== null)
          .reduce((s, r) => s + (r.precio_kg_clp ?? 0), 0) /
          (prod.filter((r) => r.precio_kg_clp !== null).length || 1),
        tiene_match: prod[0]?.precio_mayorista_id !== null,
      };
    });
    const resumenPath = `scripts/data/odepa-${YEAR}-resumen.json`;
    fs.writeFileSync(resumenPath, JSON.stringify(resumen, null, 2));
    console.log(`Resumen en ${resumenPath}`);
  } else {
    // Check for duplicates first
    const { count } = await supabase
      .from("precios_historico")
      .select("*", { count: "exact", head: true })
      .gte("fecha_odepa", `${YEAR}-01-01`)
      .lte("fecha_odepa", `${YEAR}-12-31`);

    if (count && count > 0) {
      console.log(`\n⚠️  Ya hay ${count} registros de ${YEAR} en precios_historico.`);
      console.log("   Si quieres re-importar, borra primero los existentes.");
      console.log("   Continuando de todas formas (puede crear duplicados)...\n");
    }

    await insertBatch(supabase as any, rows);
  }

  console.log("\nListo.");
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
