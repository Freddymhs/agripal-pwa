/**
 * update-precios-no-odepa.mts
 * Actualiza SOLO los precios de cultivos sin match ODEPA en precios_actual.
 *
 * NO toca los registros con fuente='odepa' — esos los mantiene el cron de la API.
 * Seguro de correr en cualquier momento sin afectar los precios frescos del cron.
 *
 * Cuándo correr:
 *   - Después de una calibración manual con fuentes externas
 *   - Para corregir estimados desactualizados
 *
 * Uso:
 *   pnpm tsx scripts/safe/seed/update-precios-no-odepa.mts
 *
 * Requiere en .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Calibración mayo 2026 — fuente: Huertita.cl retail + Tridge + referencias mayoristas
// Factor Huertita→Arica mayorista: 0.426 (5 puentes, dispersión 20%, confianza media)
const UPDATES = [
  {
    id: "arica-pitahaya",
    precio_actual_clp: 6500,
    precio_min_clp: 5000,
    precio_max_clp: 8500,
    fuente: "estimado",
  },
  {
    id: "arica-lucuma",
    precio_actual_clp: 2200,
    precio_min_clp: 1800,
    precio_max_clp: 3500,
    fuente: "estimado",
  },
  {
    id: "arica-datil-medjool",
    precio_actual_clp: 7000,
    precio_min_clp: 5500,
    precio_max_clp: 9000,
    fuente: "estimado",
  },
  {
    id: "arica-olivo",
    precio_actual_clp: 3500,
    precio_min_clp: 3000,
    precio_max_clp: 4500,
    fuente: "estimado",
  },
] as const;

async function main() {
  console.log("Actualizando precios no-ODEPA en Supabase...\n");

  for (const update of UPDATES) {
    const { id, ...fields } = update;

    // Verificar que no sea ODEPA antes de tocar
    const { data: existing } = await supabase
      .from("precios_actual")
      .select("id, nombre, fuente, precio_actual_clp")
      .eq("id", id)
      .single();

    if (!existing) {
      console.log(`  ⚠️  ${id} — no encontrado, saltando`);
      continue;
    }
    if (existing.fuente === "odepa") {
      console.log(`  🚫 ${existing.nombre} — fuente=odepa, no modificado`);
      continue;
    }

    const previo = existing.precio_actual_clp;
    const { error } = await supabase
      .from("precios_actual")
      .update(fields)
      .eq("id", id)
      .neq("fuente", "odepa");

    if (error) {
      console.error(`  ❌ ${existing.nombre}: ${error.message}`);
    } else {
      const diff = fields.precio_actual_clp - previo;
      const sign = diff >= 0 ? "+" : "";
      console.log(
        `  ✓ ${existing.nombre}: $${previo} → $${fields.precio_actual_clp} (${sign}${diff})`,
      );
    }
  }

  console.log("\n✅ Listo.");
}

main().catch(console.error);
