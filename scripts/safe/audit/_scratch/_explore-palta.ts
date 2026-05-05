import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

(async () => {
  const PAGE = 1000;
  const all: Array<{
    nombre_odepa: string | null;
    unidad_comercializacion: string | null;
    precio_actual_clp: number | null;
    precio_kg_clp: number | null;
  }> = [];
  let from = 0;
  while (true) {
    const { data, error } = await sb
      .from("precios_historico")
      .select(
        "nombre_odepa, unidad_comercializacion, precio_actual_clp, precio_kg_clp",
      )
      .eq("nombre_odepa", "Palta")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as typeof all));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  console.log("Total filas Palta:", all.length);

  type Stat = { n: number; samples: number[]; rawSamples: number[] };
  const porUnidad = new Map<string, Stat>();
  for (const r of all) {
    if (r.precio_kg_clp == null) continue;
    const k = r.unidad_comercializacion ?? "(NULL)";
    if (!porUnidad.has(k)) porUnidad.set(k, { n: 0, samples: [], rawSamples: [] });
    const s = porUnidad.get(k)!;
    s.samples.push(r.precio_kg_clp);
    s.rawSamples.push(r.precio_actual_clp ?? 0);
    s.n++;
  }
  console.log("\nPor unidad (ordenado por frecuencia):");
  for (const [u, info] of [...porUnidad.entries()].sort(
    (a, b) => b[1].n - a[1].n,
  )) {
    const sortedKg = [...info.samples].sort((a, b) => a - b);
    const sortedRaw = [...info.rawSamples].sort((a, b) => a - b);
    const medianKg = sortedKg[Math.floor(sortedKg.length / 2)];
    const medianRaw = sortedRaw[Math.floor(sortedRaw.length / 2)];
    console.log(
      `  n=${info.n.toString().padStart(4)} | medianKg=${medianKg.toString().padStart(6)} | medianRaw=${medianRaw.toString().padStart(7)} | ${u}`,
    );
  }
})();
