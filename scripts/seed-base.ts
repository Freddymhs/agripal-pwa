/**
 * seed-base.ts — Puebla todas las tablas base globales de AgriPlan.
 *
 * Correr UNA VEZ al hacer setup de una BD nueva.
 * Cada usuario que cree un proyecto recibira estos datos
 * automaticamente en su copia personal (via trigger).
 *
 * Uso:
 *   pnpm seed:base
 *
 * Requiere en .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// ─── Cliente ─────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Faltan variables: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Helper ───────────────────────────────────────────────────────────────────

function readJson<T>(filePath: string): T {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), filePath), "utf-8"),
  ) as T;
}

type RawRecord = Record<string, unknown>;

// ─── Funciones por tabla ──────────────────────────────────────────────────────

async function seedCatalogoBase(sb: SupabaseClient): Promise<void> {
  const frutas = readJson<RawRecord[]>("data/seed/cultivos-frutas.json");
  const extras = readJson<RawRecord[]>("data/seed/cultivos-extras.json");

  const payload = [...frutas, ...extras].map((c) => {
    const {
      id, nombre, tier,
      kc_plantula, kc_joven, kc_adulta, kc_madura,
      proyecto_id: _p, created_at: _ca, updated_at: _ua,
      ...datos
    } = c;
    return {
      id: id as string,
      nombre: nombre as string,
      tier: (tier as string) ?? "base",
      kc_plantula: (kc_plantula as number) ?? null,
      kc_joven: (kc_joven as number) ?? null,
      kc_adulta: (kc_adulta as number) ?? null,
      kc_madura: (kc_madura as number) ?? null,
      datos,
    };
  });

  const { error } = await sb.from("catalogo_base").upsert(payload, { onConflict: "id" });
  if (error) throw new Error(`catalogo_base: ${error.message}`);
  console.log(`  ✓ ${payload.length} cultivos (frutas.json + extras.json)`);
}

async function seedVariedades(sb: SupabaseClient): Promise<void> {
  const raw = readJson<RawRecord[]>("data/seed/variedades.json");

  const payload = raw.map((v) => {
    const { id, cultivo_id, nombre, ...datos } = v;
    return { id: id as string, cultivo_id: cultivo_id as string, nombre: nombre as string, datos };
  });

  const { error } = await sb.from("variedades_base").upsert(payload, { onConflict: "id" });
  if (error) throw new Error(`variedades_base: ${error.message}`);
  console.log(`  ✓ ${payload.length} variedades`);
}

async function seedInsumos(sb: SupabaseClient): Promise<void> {
  const raw = readJson<{ insumos: RawRecord[] }>("data/seed/insumos.json");

  const payload = raw.insumos.map((i) => {
    const { id, nombre, tipo, ...datos } = i;
    return { id: id as string, nombre: nombre as string, tipo: tipo as string, datos };
  });

  const { error } = await sb.from("insumos_base").upsert(payload, { onConflict: "id" });
  if (error) throw new Error(`insumos_base: ${error.message}`);
  console.log(`  ✓ ${payload.length} insumos`);
}

async function seedEnmiendas(sb: SupabaseClient): Promise<void> {
  const raw = readJson<RawRecord[]>("data/seed/enmiendas-suelo.json");

  const payload = raw.map((e) => {
    const { id, nombre, tipo, ...datos } = e;
    return { id: id as string, nombre: nombre as string, tipo: tipo as string, datos };
  });

  const { error } = await sb.from("enmiendas_base").upsert(payload, { onConflict: "id" });
  if (error) throw new Error(`enmiendas_base: ${error.message}`);
  console.log(`  ✓ ${payload.length} enmiendas de suelo`);
}

async function seedTecnicas(sb: SupabaseClient): Promise<void> {
  const raw = readJson<RawRecord[]>("data/seed/tecnicas.json");

  const payload = raw.map((t) => {
    const { id, nombre, categoria, ...datos } = t;
    return { id: id as string, nombre: nombre as string, categoria: categoria as string, datos };
  });

  const { error } = await sb.from("tecnicas_base").upsert(payload, { onConflict: "id" });
  if (error) throw new Error(`tecnicas_base: ${error.message}`);
  console.log(`  ✓ ${payload.length} tecnicas de mejora`);
}

async function seedClima(sb: SupabaseClient): Promise<void> {
  const regiones: { id: string; climaFile: string; etoFile: string; label: string }[] = [
    {
      id: "arica-pampa-interior",
      climaFile: "data/seed/clima.json",
      etoFile: "data/seed/evapotranspiracion.json",
      label: "Arica pampa interior",
    },
    {
      id: "iquique-costa",
      climaFile: "data/seed/clima-iquique.json",
      etoFile: "data/seed/evapotranspiracion-iquique.json",
      label: "Iquique costa",
    },
    {
      id: "antofagasta-litoral",
      climaFile: "data/seed/clima-antofagasta.json",
      etoFile: "data/seed/evapotranspiracion-antofagasta.json",
      label: "Antofagasta litoral",
    },
  ];

  const payload = regiones.map(({ id, climaFile, etoFile }) => {
    const clima = readJson<RawRecord>(climaFile);
    const eto = readJson<RawRecord>(etoFile);
    const region = `${clima.region as string} - ${clima.zona as string}`;
    return { id, region, datos: { ...clima, evapotranspiracion_detalle: eto } };
  });

  const { error } = await sb.from("clima_base").upsert(payload, { onConflict: "id" });
  if (error) throw new Error(`clima_base: ${error.message}`);
  console.log(`  ✓ ${payload.length} registros de clima (${regiones.map((r) => r.label).join(", ")})`);
}

async function seedFuentesAgua(sb: SupabaseClient): Promise<void> {
  const raw = readJson<RawRecord[]>("data/seed/fuentes-agua.json");

  const payload = raw.map((f) => {
    const { id, nombre, tipo, ...datos } = f;
    return { id: id as string, nombre: nombre as string, tipo: tipo as string, datos };
  });

  const { error } = await sb.from("fuentes_agua_base").upsert(payload, { onConflict: "id" });
  if (error) throw new Error(`fuentes_agua_base: ${error.message}`);
  console.log(`  ✓ ${payload.length} fuentes de agua`);
}

async function seedPrecios(sb: SupabaseClient): Promise<void> {
  const raw = readJson<RawRecord[]>("data/seed/precios.json");

  const payload = raw.map((p) => {
    const { cultivo_id, nombre, ...datos } = p;
    return { id: cultivo_id as string, nombre: nombre as string, datos };
  });

  const { error } = await sb.from("precios_base").upsert(payload, { onConflict: "id" });
  if (error) throw new Error(`precios_base: ${error.message}`);
  console.log(`  ✓ ${payload.length} precios de mercado`);
}

async function seedPlanes(sb: SupabaseClient): Promise<void> {
  // Verificar si ya existe
  const { data: existente } = await sb
    .from("planes")
    .select("id")
    .eq("nombre", "Plan Mensual")
    .maybeSingle();

  if (existente) {
    console.log(`  ✓ Plan Mensual ya existe (skip)`);
    return;
  }

  const { error } = await sb.from("planes").insert({
    nombre: "Plan Mensual",
    precio: 9990,
    moneda: "CLP",
    intervalo: "monthly",
    descripcion: "Acceso completo a AgriPlan",
    activo: true,
  });
  if (error) throw new Error(`planes: ${error.message}`);
  console.log(`  ✓ Plan Mensual ($9.990 CLP)`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

(async () => {
  try {
    console.log("\n[0] Inicio del Seed Base\n");

    console.log("[1] Catalogo de cultivos");
    await seedCatalogoBase(supabase);

    console.log("\n[2] Variedades");
    await seedVariedades(supabase);

    console.log("\n[3] Insumos");
    await seedInsumos(supabase);

    console.log("\n[4] Enmiendas de suelo");
    await seedEnmiendas(supabase);

    console.log("\n[5] Tecnicas de mejora");
    await seedTecnicas(supabase);

    console.log("\n[6] Clima");
    await seedClima(supabase);

    console.log("\n[7] Fuentes de agua");
    await seedFuentesAgua(supabase);

    console.log("\n[8] Precios de mercado");
    await seedPrecios(supabase);

    console.log("\n[9] Plan de suscripcion");
    await seedPlanes(supabase);

    console.log("\n✅ Seed base completado. Nuevos usuarios recibiran estos datos al crear su primer proyecto.\n");
  } catch (error) {
    console.error("\n❌ Seed base fallido:", (error as Error).message);
    process.exit(1);
  }
})();
