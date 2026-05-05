/**
 * builder.ts — Builders y runner para describir layouts de seed.
 *
 * Cada layout (owner, demo, …) describe sus zonas con builders tipados
 * (cultivo, estanque, bodega, casa, sanitario, apron, garage, empaque,
 * compostera) e invoca runLayout() con email + terreno + zonas. El
 * runner se encarga del cliente Supabase, de borrar el proyecto previo
 * y de insertar proyecto/terreno/zonas de forma idempotente.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const NOMBRE_PROYECTO_SEED = "Proyecto Regional";
const NOMBRE_TERRENO_SEED = "Terreno Ejemplo";

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export type ZonaDef = {
  nombre: string;
  tipo: string;
  datos: Record<string, unknown>;
};

export type Coords = {
  x: number;
  y: number;
  w: number;
  h: number;
  notas?: string;
};

export type LayoutConfig = {
  label: string;
  email: string;
  terreno: { ancho: number; alto: number; agua: number };
  zonas: ZonaDef[];
};

// ─── Factories por tipo de zona ───────────────────────────────────────────────

const COLOR = {
  cultivo: "#16a34a",
  estanque: "#0ea5e9",
  compostera: "#78350f",
  bodega: "#92400e",
  garage: "#1d4ed8",
  casa: "#f97316",
  sanitario: "#475569",
  empaque: "#f59e0b",
  apron: "#d97706",
} as const;

function buildZona(
  tipo: keyof typeof COLOR,
  nombre: string,
  c: Coords,
  extra: Record<string, unknown> = {},
): ZonaDef {
  return {
    nombre,
    tipo,
    datos: {
      x: c.x,
      y: c.y,
      ancho: c.w,
      alto: c.h,
      area_m2: c.w * c.h,
      color: COLOR[tipo],
      estado: "activa",
      notas: c.notas ?? "",
      ...extra,
    },
  };
}

export const cultivo = (nombre: string, c: Coords) =>
  buildZona("cultivo", nombre, c);
export const bodega = (nombre: string, c: Coords) =>
  buildZona("bodega", nombre, c);
export const garage = (nombre: string, c: Coords) =>
  buildZona("garage", nombre, c);
export const casa = (nombre: string, c: Coords) =>
  buildZona("casa", nombre, c);
export const sanitario = (nombre: string, c: Coords) =>
  buildZona("sanitario", nombre, c);
export const empaque = (nombre: string, c: Coords) =>
  buildZona("empaque", nombre, c);
export const apron = (nombre: string, c: Coords) =>
  buildZona("apron", nombre, c);
export const compostera = (nombre: string, c: Coords) =>
  buildZona("compostera", nombre, c);

export const estanque = (
  nombre: string,
  c: Coords & {
    capacidad: number;
    torre?: number;
    material?: "plastico" | "metal";
  },
) =>
  buildZona("estanque", nombre, c, {
    estanque_config: {
      capacidad_m3: c.capacidad,
      nivel_actual_m3: c.capacidad,
      material: c.material ?? "plastico",
      altura_torre_m: c.torre ?? 5,
    },
  });

// ─── Cliente Supabase + helpers de BD ─────────────────────────────────────────

function createSeedClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "Faltan variables: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY",
    );
    process.exit(1);
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function resolveUserId(
  sb: SupabaseClient,
  email: string,
): Promise<string> {
  const { data, error } = await sb.auth.admin.listUsers();
  if (error) throw new Error(`No se pudo listar usuarios: ${error.message}`);
  const user = data.users.find((u) => u.email === email);
  if (!user) throw new Error(`No existe usuario con email "${email}"`);
  return user.id;
}

async function deleteProyectoSeed(
  sb: SupabaseClient,
  usuarioId: string,
): Promise<void> {
  const { data: proyectos, error: fetchError } = await sb
    .from("proyectos")
    .select("id")
    .eq("usuario_id", usuarioId)
    .eq("nombre", NOMBRE_PROYECTO_SEED);

  if (fetchError) throw new Error(`proyectos fetch: ${fetchError.message}`);
  if (!proyectos || proyectos.length === 0) return;

  for (const proyecto of proyectos) {
    const { data: terrenos, error: terrenosError } = await sb
      .from("terrenos")
      .select("id")
      .eq("proyecto_id", proyecto.id);
    if (terrenosError)
      throw new Error(`terrenos fetch: ${terrenosError.message}`);

    if (terrenos && terrenos.length > 0) {
      const ids = terrenos.map((t) => t.id);
      const { error: zErr } = await sb.from("zonas").delete().in("terreno_id", ids);
      if (zErr) throw new Error(`zonas delete: ${zErr.message}`);
      const { error: tErr } = await sb.from("terrenos").delete().in("id", ids);
      if (tErr) throw new Error(`terrenos delete: ${tErr.message}`);
    }

    const { error: pErr } = await sb
      .from("proyectos")
      .delete()
      .eq("id", proyecto.id);
    if (pErr) throw new Error(`proyectos delete: ${pErr.message}`);
  }
  console.log(`  · Proyecto "${NOMBRE_PROYECTO_SEED}" previo eliminado`);
}

async function insertLayout(
  sb: SupabaseClient,
  usuarioId: string,
  terreno: LayoutConfig["terreno"],
  zonas: ZonaDef[],
): Promise<void> {
  const { data: proyecto, error: pErr } = await sb
    .from("proyectos")
    .insert({ usuario_id: usuarioId, nombre: NOMBRE_PROYECTO_SEED, datos: {} })
    .select("id")
    .single();
  if (pErr) throw new Error(`proyectos: ${pErr.message}`);
  console.log(`  ✓ Proyecto "${NOMBRE_PROYECTO_SEED}" (${proyecto.id})`);

  const { data: terrenoRow, error: tErr } = await sb
    .from("terrenos")
    .insert({
      proyecto_id: proyecto.id,
      nombre: NOMBRE_TERRENO_SEED,
      datos: {
        ancho_m: terreno.ancho,
        alto_m: terreno.alto,
        area_m2: terreno.ancho * terreno.alto,
        agua_disponible_m3: terreno.agua,
        agua_actual_m3: terreno.agua,
        suelo: null,
        sistema_riego: null,
      },
    })
    .select("id")
    .single();
  if (tErr) throw new Error(`terrenos: ${tErr.message}`);
  console.log(`  ✓ Terreno "${NOMBRE_TERRENO_SEED}" (${terrenoRow.id})`);

  const payload = zonas.map((z) => ({
    terreno_id: terrenoRow.id,
    nombre: z.nombre,
    tipo: z.tipo,
    datos: z.datos,
  }));
  const { data: zonasData, error: zErr } = await sb
    .from("zonas")
    .insert(payload)
    .select("nombre");
  if (zErr) throw new Error(`zonas: ${zErr.message}`);
  console.log(`  ✓ ${zonasData.length} zonas creadas`);
  zonasData.forEach((z) => console.log(`      · ${z.nombre}`));
}

// ─── Runner público ──────────────────────────────────────────────────────────

export function runLayout(cfg: LayoutConfig): void {
  (async () => {
    try {
      console.log(`\n▶ Seed layout: ${cfg.label} (${cfg.email})\n`);
      const sb = createSeedClient();
      const userId = await resolveUserId(sb, cfg.email);
      await deleteProyectoSeed(sb, userId);
      await insertLayout(sb, userId, cfg.terreno, cfg.zonas);
      console.log("\n✅ Seed completado.\n");
    } catch (error) {
      console.error("\n❌ Seed fallido:", (error as Error).message);
      process.exit(1);
    }
  })();
}
