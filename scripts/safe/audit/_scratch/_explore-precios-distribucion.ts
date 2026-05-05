/**
 * _explore-precios-distribucion.ts — Distribución real de precio_kg_clp por cultivo.
 *
 * Para detectar conversiones fuera de rango realista (no solo del threshold del audit).
 *
 * Uso: pnpm tsx scripts/safe/audit/_explore-precios-distribucion.ts
 *
 * Read-only.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

type Row = {
  nombre_odepa: string | null;
  unidad_comercializacion: string | null;
  precio_actual_clp: number | null;
  precio_kg_clp: number | null;
};

async function fetchAll(sb: SupabaseClient): Promise<Row[]> {
  const PAGE = 1000;
  const all: Row[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await sb
      .from("precios_historico")
      .select(
        "nombre_odepa, unidad_comercializacion, precio_actual_clp, precio_kg_clp",
      )
      .not("precio_kg_clp", "is", null)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as Row[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const i = Math.floor(sorted.length * q);
  return sorted[Math.min(i, sorted.length - 1)];
}

(async () => {
  const data = await fetchAll(sb);
  console.log(`\nTotal filas con precio_kg_clp: ${data.length}\n`);

  const porCultivo = new Map<string, number[]>();
  for (const r of data) {
    if (r.precio_kg_clp == null) continue;
    const key = r.nombre_odepa ?? "(sin nombre)";
    if (!porCultivo.has(key)) porCultivo.set(key, []);
    porCultivo.get(key)!.push(r.precio_kg_clp);
  }

  type Stat = {
    cultivo: string;
    n: number;
    min: number;
    p50: number;
    p90: number;
    max: number;
  };
  const stats: Stat[] = [];
  for (const [cultivo, precios] of porCultivo) {
    const sorted = [...precios].sort((a, b) => a - b);
    stats.push({
      cultivo,
      n: precios.length,
      min: sorted[0],
      p50: quantile(sorted, 0.5),
      p90: quantile(sorted, 0.9),
      max: sorted[sorted.length - 1],
    });
  }

  // Top 20 más caros por p50
  const topCaros = [...stats].sort((a, b) => b.p50 - a.p50).slice(0, 20);

  console.log("Top 20 cultivos por mediana de precio_kg_clp (sospechosos arriba):\n");
  console.log(
    "  cultivo".padEnd(35) +
      "n".padStart(6) +
      "min".padStart(10) +
      "p50".padStart(10) +
      "p90".padStart(10) +
      "max".padStart(10),
  );
  console.log("  " + "─".repeat(81));
  for (const s of topCaros) {
    console.log(
      `  ${s.cultivo.padEnd(33)}` +
        `${s.n.toString().padStart(6)}` +
        `${s.min.toString().padStart(10)}` +
        `${s.p50.toString().padStart(10)}` +
        `${s.p90.toString().padStart(10)}` +
        `${s.max.toString().padStart(10)}`,
    );
  }

  // Cuántos cultivos tienen p50 > 5000 (sospechoso)
  const sospechosos = stats.filter((s) => s.p50 > 5000);
  console.log(`\n${sospechosos.length} de ${stats.length} cultivos tienen mediana > $5.000/kg (sospechoso)`);
  console.log(`${stats.filter((s) => s.p50 > 10000).length} con mediana > $10.000/kg (muy sospechoso)`);

  // Cuántas filas individuales > umbrales
  const flat = data.map((r) => r.precio_kg_clp!).filter((p) => p != null);
  flat.sort((a, b) => a - b);
  console.log(`\nDistribución global de precio_kg_clp (n=${flat.length}):`);
  console.log(`  min=${flat[0]} | p10=${quantile(flat, 0.1)} | p50=${quantile(flat, 0.5)} | p90=${quantile(flat, 0.9)} | p99=${quantile(flat, 0.99)} | max=${flat[flat.length - 1]}`);
  console.log(`  > $2.000/kg : ${flat.filter((p) => p > 2000).length}`);
  console.log(`  > $5.000/kg : ${flat.filter((p) => p > 5000).length}`);
  console.log(`  > $10.000/kg: ${flat.filter((p) => p > 10000).length}`);
})();
