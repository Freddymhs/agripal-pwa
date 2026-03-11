/**
 * Script de verificación backend para FASE 13 — Sync Supabase
 *
 * Uso:
 *   npx tsx scripts/verify-sync.ts                    # resumen de todas las tablas
 *   npx tsx scripts/verify-sync.ts --tabla proyectos  # detalle de una tabla
 *   npx tsx scripts/verify-sync.ts --check "Test Sync 01"  # buscar por nombre
 *   npx tsx scripts/verify-sync.ts --rls              # verificar aislamiento RLS
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "../.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("ERROR: Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TABLAS = [
  "proyectos",
  "terrenos",
  "zonas",
  "plantas",
  "entradas_agua",
  "cosechas",
  "alertas",
  "catalogo_cultivos",
  "insumos_usuario",
] as const;

// ─── Comandos ───────────────────────────────────────────

async function resumenTablas(): Promise<void> {
  console.log("\n╔═══════════════════════════════════════════╗");
  console.log("║  VERIFICACION BACKEND — Tablas Supabase   ║");
  console.log("╚═══════════════════════════════════════════╝\n");

  let totalRows = 0;

  for (const tabla of TABLAS) {
    const { data, error } = await supabase.from(tabla).select("id");

    if (error) {
      console.log(`  ❌ ${tabla.padEnd(20)} ERROR: ${error.message}`);
      continue;
    }

    const count = data?.length ?? 0;
    totalRows += count;
    const status = count > 0 ? "✅" : "⚪";
    console.log(`  ${status} ${tabla.padEnd(20)} ${String(count).padStart(4)} registros`);
  }

  console.log(`\n  TOTAL: ${totalRows} registros en ${TABLAS.length} tablas\n`);
}

async function detalleTabla(tabla: string): Promise<void> {
  console.log(`\n── Detalle: ${tabla} ──\n`);

  const { data, error } = await supabase.from(tabla).select("*");

  if (error) {
    console.error(`ERROR: ${error.message}`);
    return;
  }

  if (!data || data.length === 0) {
    console.log("  (vacío)");
    return;
  }

  for (const row of data) {
    const id = (row.id as string).substring(0, 8);
    const nombre = (row as Record<string, unknown>).nombre ?? "-";
    const updatedAt = (row as Record<string, unknown>).updated_at ?? "-";
    const usuarioId = (row as Record<string, unknown>).usuario_id;
    const extra = usuarioId ? `  usuario: ${(usuarioId as string).substring(0, 8)}...` : "";
    console.log(`  ${id}...  ${String(nombre).padEnd(25)} updated: ${updatedAt}${extra}`);
  }

  console.log(`\n  Total: ${data.length}\n`);
}

async function buscarPorNombre(nombre: string): Promise<void> {
  console.log(`\n── Buscando "${nombre}" en todas las tablas ──\n`);

  let found = false;

  for (const tabla of TABLAS) {
    const { data, error } = await supabase
      .from(tabla)
      .select("id, nombre")
      .ilike("nombre", `%${nombre}%`);

    if (error) continue;
    if (!data || data.length === 0) continue;

    found = true;
    for (const row of data) {
      console.log(`  ✅ ${tabla.padEnd(20)} id: ${(row.id as string).substring(0, 8)}...  nombre: ${row.nombre}`);
    }
  }

  if (!found) {
    console.log(`  ❌ No encontrado en ninguna tabla`);
  }
  console.log();
}

async function verificarRLS(): Promise<void> {
  console.log("\n── Verificación RLS ──\n");
  console.log("  NOTA: Esta verificación usa el anon key (usuario anónimo).");
  console.log("  Si RLS está activo, debería devolver 0 registros sin sesión.\n");

  // Sin sesión activa, el anon key no debería ver nada
  const { data, error } = await supabase.from("proyectos").select("id, nombre, usuario_id");

  if (error) {
    console.log(`  ✅ RLS ACTIVO — Error de acceso: ${error.message}`);
    return;
  }

  if (!data || data.length === 0) {
    console.log("  ✅ RLS ACTIVO — 0 registros visibles sin sesión");
  } else {
    console.log(`  ⚠️  RLS PROBLEMA — ${data.length} registros visibles sin sesión:`);
    for (const row of data) {
      console.log(`     id: ${(row.id as string).substring(0, 8)}  usuario: ${(row.usuario_id as string).substring(0, 8)}  nombre: ${row.nombre}`);
    }
  }
  console.log();
}

// ─── Main ───────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("--rls")) {
    await verificarRLS();
    return;
  }

  const tablaIdx = args.indexOf("--tabla");
  if (tablaIdx !== -1 && args[tablaIdx + 1]) {
    await detalleTabla(args[tablaIdx + 1]);
    return;
  }

  const checkIdx = args.indexOf("--check");
  if (checkIdx !== -1 && args[checkIdx + 1]) {
    await buscarPorNombre(args[checkIdx + 1]);
    return;
  }

  await resumenTablas();
}

main().catch(console.error);
