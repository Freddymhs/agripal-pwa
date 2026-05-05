/**
 * _explore-precios-fallidos.ts — One-shot: agrupa las 301 filas inválidas de
 * precios_historico por unidad_comercializacion para identificar qué formatos
 * de unidad ODEPA no están siendo parseados por el adapter de la API.
 *
 * Read-only. Imprime tabla en consola. NO escribe nada.
 *
 * Uso: pnpm tsx scripts/safe/audit/_explore-precios-fallidos.ts
 *
 * Prefijo "_" indica: script exploratorio, no audit recurrente.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const PRECIO_MAX_CLP = 15000;

(async () => {
  const { data, error } = await sb
    .from("precios_historico")
    .select(
      "nombre_odepa, region, unidad_comercializacion, precio_actual_clp, precio_kg_clp",
    )
    .gt("precio_actual_clp", PRECIO_MAX_CLP)
    .limit(100000);

  if (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }

  const rows = data ?? [];
  console.log(`\nFilas con precio > ${PRECIO_MAX_CLP}: ${rows.length}\n`);

  // Agrupar por unidad_comercializacion
  const porUnidad = new Map<
    string,
    { count: number; cultivos: Set<string>; muestras: number[] }
  >();
  for (const r of rows) {
    const key = r.unidad_comercializacion ?? "(NULL)";
    if (!porUnidad.has(key))
      porUnidad.set(key, { count: 0, cultivos: new Set(), muestras: [] });
    const e = porUnidad.get(key)!;
    e.count += 1;
    e.cultivos.add(r.nombre_odepa ?? "(sin nombre)");
    if (e.muestras.length < 3 && typeof r.precio_actual_clp === "number")
      e.muestras.push(r.precio_actual_clp);
  }

  const sorted = [...porUnidad.entries()].sort((a, b) => b[1].count - a[1].count);

  console.log("UNIDADES QUE FALLAN (ordenadas por frecuencia):\n");
  for (const [unidad, info] of sorted) {
    console.log(`  ${info.count.toString().padStart(4)} filas | "${unidad}"`);
    console.log(`       cultivos: ${[...info.cultivos].slice(0, 5).join(", ")}${info.cultivos.size > 5 ? `, +${info.cultivos.size - 5} más` : ""}`);
    console.log(`       precios: ${info.muestras.join(", ")}\n`);
  }

  // ¿Cuántas tienen precio_kg_clp ya seteado correctamente?
  const conKg = rows.filter((r) => r.precio_kg_clp != null);
  console.log(`\nDe las ${rows.length} filas inválidas:`);
  console.log(`  • ${conKg.length} tienen precio_kg_clp seteado (recuperable directo)`);
  console.log(`  • ${rows.length - conKg.length} tienen precio_kg_clp NULL (parser falló totalmente)`);
})();
