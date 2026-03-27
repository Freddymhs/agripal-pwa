/**
 * db-reset.ts — Vacía TODAS las tablas + usuarios de auth. Solo para desarrollo.
 *
 * Flujo limpio:
 *   1. pnpm db:reset       ← vacía tablas + borra usuarios auth
 *   2. pnpm seed:base      ← puebla tablas _base
 *   3. Registrarse en la app ← trigger copia _base → _proyecto + crea trial
 *   4. pnpm seed            ← (opcional) crea proyecto piloto
 *
 * Requiere en .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

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

// Orden: hijos primero, padres después (respetar foreign keys)
// Tablas históricas protegidas: nunca se borran con este script
const TABLAS_PROTEGIDAS = new Set([
  "precios_historico",
  "clima_historico",
  "publicaciones_inia",
  "precios_actual",
  "precios_actual_config",
]);

const TABLAS_EN_ORDEN = [
  // Datos de usuario (hijos más profundos)
  "alertas",
  "cosechas",
  "entradas_agua",
  "sesiones_riego",
  "insumos_usuario",
  "plantas",
  "zonas",
  "terrenos",
  // Per-proyecto (copias del usuario)
  "catalogo_cultivos",
  "insumos_catalogo",
  "enmiendas_proyecto",
  "tecnicas_proyecto",
  "fuentes_agua_proyecto",
  // Billing
  "pagos",
  "suscripciones",
  // Proyecto (padre de todo lo per-proyecto)
  "proyectos",
  // Config (1:1, CASCADE se encarga pero explícito es mejor)
  "precios_actual_config",
  "catalogo_cultivos_config",
  // Tablas base globales (seed:base las repuebla)
  "catalogo_base",
  "variedades_base",
  "insumos_base",
  "enmiendas_base",
  "tecnicas_base",
  "clima_actual",
  "fuentes_agua_base",
  "mercado_detalle",
  "precios_actual",
  // Billing base
  "planes",
] as const;

async function resetTablas(): Promise<void> {
  console.log("[1] Vaciando tablas...\n");
  for (const tabla of TABLAS_EN_ORDEN) {
    if (TABLAS_PROTEGIDAS.has(tabla)) {
      console.log(`  → ${tabla} (protegida, no se borra)`);
      continue;
    }
    const { error } = await supabase.from(tabla).delete().not("id", "is", null);
    if (error) {
      console.error(`  ✗ ${tabla}: ${error.message}`);
    } else {
      console.log(`  ✓ ${tabla}`);
    }
  }
}

async function resetUsuarios(): Promise<void> {
  console.log("\n[2] Borrando usuarios de auth...\n");

  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error(`  ✗ No se pudo listar usuarios: ${error.message}`);
    return;
  }

  if (data.users.length === 0) {
    console.log("  ✓ No hay usuarios que borrar");
    return;
  }

  for (const user of data.users) {
    const { error: deleteError } = await supabase.auth.admin.deleteUser(
      user.id,
    );
    if (deleteError) {
      console.error(`  ✗ ${user.email}: ${deleteError.message}`);
    } else {
      console.log(`  ✓ ${user.email}`);
    }
  }
}

(async () => {
  console.log("\n⚠️  db-reset: Reseteando AgriPlan por completo...\n");

  await resetTablas();
  await resetUsuarios();

  console.log(
    "\n✅ Reset completo. Siguiente paso: pnpm seed:base → registrarse\n",
  );
})();
