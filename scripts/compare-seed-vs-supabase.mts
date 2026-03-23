import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";
import dotenv from "dotenv";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(url, key);

const root = process.cwd();

// Read seed JSONs
const frutas = JSON.parse(
  readFileSync(resolve(root, "data/seed/cultivos-frutas.json"), "utf-8"),
);
const extras = JSON.parse(
  readFileSync(resolve(root, "data/seed/cultivos-extras.json"), "utf-8"),
);
const seedCultivos = [...frutas, ...extras];
const seedPrecios = JSON.parse(
  readFileSync(resolve(root, "data/seed/precios.json"), "utf-8"),
);

// Read from Supabase
const { data: dbCultivos } = await supabase.from("catalogo_base").select("*");
const { data: dbPrecios } = await supabase
  .from("precios_mayoristas")
  .select("*");

if (!dbCultivos || !dbPrecios) {
  console.error("No se pudo leer Supabase");
  process.exit(1);
}

console.log(
  `\n=== CATALOGO_BASE: ${dbCultivos.length} en BD vs ${seedCultivos.length} en seed ===\n`,
);

const fieldsToCompare = [
  "nombre",
  "agua_m3_ha_año_min",
  "agua_m3_ha_año_max",
  "espaciado_recomendado_m",
  "ph_min",
  "ph_max",
  "salinidad_tolerancia_dS_m",
  "boro_tolerancia_ppm",
  "precio_kg_min_clp",
  "precio_kg_max_clp",
  "precio_planta_clp",
  "tiempo_produccion_meses",
  "vida_util_años",
  "tier",
  "riesgo",
  "kc_plantula",
  "kc_joven",
  "kc_adulta",
  "kc_madura",
];

const prodFields = [
  "produccion_kg_ha_año2",
  "produccion_kg_ha_año3",
  "produccion_kg_ha_año4",
];

for (const dbC of dbCultivos) {
  const seedC = seedCultivos.find((s: Record<string, unknown>) => s.id === dbC.id);
  if (!seedC) {
    console.log(
      `[SOLO BD] ${dbC.id} "${dbC.nombre}" — no existe en seed JSON`,
    );
    continue;
  }

  const diffs: string[] = [];
  for (const f of fieldsToCompare) {
    const dbVal = dbC[f];
    const seedVal = seedC[f];
    if (dbVal !== seedVal && dbVal != null && seedVal != null) {
      diffs.push(`  ${f}: seed=${seedVal} → BD=${dbVal}`);
    } else if (dbVal != null && seedVal == null) {
      diffs.push(`  ${f}: seed=NULL → BD=${dbVal}`);
    }
  }

  // Compare produccion (nested in seed, JSONB in BD)
  const dbProd = (dbC.produccion as Record<string, unknown>) || {};
  const seedProd = (seedC.produccion as Record<string, unknown>) || {};
  for (const f of prodFields) {
    const dbVal = dbProd[f];
    const seedVal = seedProd[f];
    if (dbVal !== seedVal && dbVal != null && seedVal != null) {
      diffs.push(`  produccion.${f}: seed=${seedVal} → BD=${dbVal}`);
    }
  }

  if (diffs.length > 0) {
    console.log(`[DIFF] ${dbC.nombre}:`);
    for (const d of diffs) console.log(d);
    console.log();
  }
}

// Check seed entries not in BD
for (const seedC of seedCultivos) {
  const sc = seedC as Record<string, unknown>;
  const dbC = dbCultivos.find((d: Record<string, unknown>) => d.id === sc.id);
  if (!dbC) {
    console.log(`[SOLO SEED] ${sc.id} "${sc.nombre}" — no existe en BD`);
  }
}

console.log(
  `\n=== PRECIOS_MAYORISTAS: ${dbPrecios.length} en BD vs ${seedPrecios.length} en seed ===\n`,
);

const precioFields = [
  "precio_actual_clp",
  "precio_min_clp",
  "precio_max_clp",
  "tendencia",
  "fuente",
  "nombre_odepa",
];

for (const dbP of dbPrecios) {
  const seedP = seedPrecios.find((s: Record<string, unknown>) => s.id === dbP.id);
  if (!seedP) {
    console.log(
      `[SOLO BD] ${dbP.id} "${dbP.nombre}" — precio=${dbP.precio_actual_clp}`,
    );
    continue;
  }

  const diffs: string[] = [];
  for (const f of precioFields) {
    const dbVal = dbP[f];
    const seedVal = (seedP as Record<string, unknown>)[f];
    if (String(dbVal) !== String(seedVal) && dbVal != null) {
      diffs.push(`  ${f}: seed=${seedVal ?? "NULL"} → BD=${dbVal}`);
    }
  }

  if (diffs.length > 0) {
    console.log(`[DIFF] ${dbP.nombre} (${dbP.region}):`);
    for (const d of diffs) console.log(d);
    console.log();
  }
}

for (const seedP of seedPrecios) {
  const sp = seedP as Record<string, unknown>;
  const dbP = dbPrecios.find((d: Record<string, unknown>) => d.id === sp.id);
  if (!dbP) {
    console.log(`[SOLO SEED] ${sp.id} "${sp.nombre}" — no existe en BD`);
  }
}

console.log("\n=== DONE ===");
