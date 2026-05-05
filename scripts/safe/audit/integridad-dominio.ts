/**
 * integridad-dominio.ts — Verifica 7 invariantes de dominio que Postgres NO bloquea.
 *
 * Read-only. No modifica nada. Genera un reporte JSON estructurado en
 *   scripts/safe/audit/reports/integridad-dominio/<timestamp>.json
 *   scripts/safe/audit/reports/integridad-dominio/latest.json
 *
 * Uso:
 *   pnpm audit:integridad
 *
 * Cada invariante:
 *   1. plantas.tipo_cultivo_id huérfano respecto a catalogo_base
 *   2. cosechas.tipo_cultivo_id huérfano respecto a catalogo_base
 *   3. catalogo_cultivos.nombre ≠ catalogo_base.nombre (drift de copia)
 *   4. sesiones_riego.terreno_id ≠ zona.terreno_id
 *   5. zonas.estanque_id apunta a zona inexistente / no-estanque / otro terreno
 *   6. precios_historico.precio_kg_clp NULL o fuera de rango (parser ODEPA falló)
 *   7. suscripciones con períodos inconsistentes
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Faltan variables: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY",
  );
  process.exit(2);
}

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SAMPLE_LIMIT = 20;
// Tolerancia en CLP para diferencias de redondeo entre precio_kg_clp esperado y actual.
const TOLERANCIA_CLP = 2;

type InvariantResult = {
  id: string;
  statement: string;
  status: "ok" | "violation" | "error";
  count: number;
  sample: unknown[];
  meaning: string;
  query_hint: string;
  buckets?: Record<string, number>;
};

type CheckFn = (sb: SupabaseClient) => Promise<InvariantResult>;

// ─── Invariantes ─────────────────────────────────────────────────────────────

const plantasCultivoOrphan: CheckFn = async (sb) => {
  const [plantasRes, cultivosRes] = await Promise.all([
    sb
      .from("plantas")
      .select("id, zona_id, tipo_cultivo_id")
      .not("tipo_cultivo_id", "is", null)
      .limit(50000),
    sb.from("catalogo_base").select("id").limit(50000),
  ]);
  if (plantasRes.error) throw plantasRes.error;
  if (cultivosRes.error) throw cultivosRes.error;

  const valid = new Set((cultivosRes.data ?? []).map((c) => c.id));
  const orphans = (plantasRes.data ?? []).filter(
    (p) => !valid.has(p.tipo_cultivo_id),
  );
  return {
    id: "plantas-cultivo-base-orphan",
    statement: "Toda planta apunta a un cultivo_base existente",
    status: orphans.length === 0 ? "ok" : "violation",
    count: orphans.length,
    sample: orphans.slice(0, SAMPLE_LIMIT),
    meaning:
      "Plantas referencian cultivos inexistentes — riego, cosecha y reportes fallan silenciosamente.",
    query_hint:
      "SELECT p.* FROM plantas p LEFT JOIN catalogo_base cb ON cb.id = p.tipo_cultivo_id WHERE p.tipo_cultivo_id IS NOT NULL AND cb.id IS NULL",
  };
};

const cosechasCultivoOrphan: CheckFn = async (sb) => {
  const [cosechasRes, cultivosRes] = await Promise.all([
    sb
      .from("cosechas")
      .select("id, zona_id, tipo_cultivo_id, fecha")
      .not("tipo_cultivo_id", "is", null)
      .limit(50000),
    sb.from("catalogo_base").select("id").limit(50000),
  ]);
  if (cosechasRes.error) throw cosechasRes.error;
  if (cultivosRes.error) throw cultivosRes.error;

  const valid = new Set((cultivosRes.data ?? []).map((c) => c.id));
  const orphans = (cosechasRes.data ?? []).filter(
    (c) => !valid.has(c.tipo_cultivo_id),
  );
  return {
    id: "cosechas-cultivo-base-orphan",
    statement: "Toda cosecha apunta a un cultivo_base existente",
    status: orphans.length === 0 ? "ok" : "violation",
    count: orphans.length,
    sample: orphans.slice(0, SAMPLE_LIMIT),
    meaning:
      "Cosechas registradas contra un cultivo que ya no existe en el catálogo global.",
    query_hint:
      "SELECT c.* FROM cosechas c LEFT JOIN catalogo_base cb ON cb.id = c.tipo_cultivo_id WHERE c.tipo_cultivo_id IS NOT NULL AND cb.id IS NULL",
  };
};

const catalogoNombreDrift: CheckFn = async (sb) => {
  const [ccRes, cbRes] = await Promise.all([
    sb
      .from("catalogo_cultivos")
      .select("id, proyecto_id, nombre, cultivo_base_id")
      .not("cultivo_base_id", "is", null)
      .limit(50000),
    sb.from("catalogo_base").select("id, nombre").limit(50000),
  ]);
  if (ccRes.error) throw ccRes.error;
  if (cbRes.error) throw cbRes.error;

  const cbMap = new Map(
    (cbRes.data ?? []).map((c) => [c.id, String(c.nombre).trim().toLowerCase()]),
  );
  const drift = (ccRes.data ?? [])
    .map((c) => {
      const baseName = cbMap.get(c.cultivo_base_id);
      if (!baseName) return null;
      const projName = String(c.nombre).trim().toLowerCase();
      if (baseName === projName) return null;
      return {
        id: c.id,
        proyecto_id: c.proyecto_id,
        cultivo_base_id: c.cultivo_base_id,
        nombre_proyecto: c.nombre,
        nombre_base: cbRes.data?.find((cb) => cb.id === c.cultivo_base_id)
          ?.nombre,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return {
    id: "catalogo-cultivos-nombre-drift",
    statement:
      "catalogo_cultivos.nombre debe coincidir con catalogo_base.nombre (case-insensitive)",
    status: drift.length === 0 ? "ok" : "violation",
    count: drift.length,
    sample: drift.slice(0, SAMPLE_LIMIT),
    meaning:
      "La copia per-user se renombró o el global mutó — pierde trazabilidad nombre↔id.",
    query_hint:
      "SELECT cc.*, cb.nombre AS nombre_base FROM catalogo_cultivos cc JOIN catalogo_base cb ON cb.id = cc.cultivo_base_id WHERE lower(trim(cc.nombre)) <> lower(trim(cb.nombre))",
  };
};

const sesionesRiegoTerrenoMismatch: CheckFn = async (sb) => {
  const [sesionesRes, zonasRes] = await Promise.all([
    sb.from("sesiones_riego").select("id, zona_id, terreno_id").limit(50000),
    sb.from("zonas").select("id, terreno_id").limit(50000),
  ]);
  if (sesionesRes.error) throw sesionesRes.error;
  if (zonasRes.error) throw zonasRes.error;

  const zonaToTerreno = new Map(
    (zonasRes.data ?? []).map((z) => [z.id, z.terreno_id]),
  );
  const inconsistent = (sesionesRes.data ?? [])
    .map((s) => {
      const real = zonaToTerreno.get(s.zona_id);
      if (real === undefined || real === s.terreno_id) return null;
      return {
        id: s.id,
        zona_id: s.zona_id,
        terreno_sesion: s.terreno_id,
        terreno_real_zona: real,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return {
    id: "sesiones-riego-terreno-mismatch",
    statement: "sesiones_riego.terreno_id debe coincidir con zona.terreno_id",
    status: inconsistent.length === 0 ? "ok" : "violation",
    count: inconsistent.length,
    sample: inconsistent.slice(0, SAMPLE_LIMIT),
    meaning: "Consumo de agua atribuido al terreno equivocado.",
    query_hint:
      "SELECT sr.*, z.terreno_id AS terreno_real FROM sesiones_riego sr JOIN zonas z ON z.id = sr.zona_id WHERE sr.terreno_id <> z.terreno_id",
  };
};

const zonaEstanqueValido: CheckFn = async (sb) => {
  const { data: zonas, error } = await sb
    .from("zonas")
    .select("id, terreno_id, tipo, estanque_id")
    .limit(50000);
  if (error) throw error;

  const byId = new Map((zonas ?? []).map((z) => [z.id, z]));
  const bad = (zonas ?? [])
    .map((z) => {
      if (!z.estanque_id) return null;
      const target = byId.get(z.estanque_id);
      if (!target) {
        return {
          id: z.id,
          terreno_id: z.terreno_id,
          tipo: z.tipo,
          estanque_id: z.estanque_id,
          razon: "estanque_id apunta a zona inexistente",
        };
      }
      if (target.tipo !== "estanque" || target.terreno_id !== z.terreno_id) {
        return {
          id: z.id,
          terreno_id: z.terreno_id,
          tipo: z.tipo,
          estanque_id: z.estanque_id,
          estanque_terreno: target.terreno_id,
          estanque_tipo: target.tipo,
          razon:
            target.tipo !== "estanque"
              ? "zona referenciada no es tipo estanque"
              : "estanque pertenece a otro terreno",
        };
      }
      return null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return {
    id: "zona-estanque-valido",
    statement:
      "zonas.estanque_id debe apuntar a una zona tipo 'estanque' del MISMO terreno",
    status: bad.length === 0 ? "ok" : "violation",
    count: bad.length,
    sample: bad.slice(0, SAMPLE_LIMIT),
    meaning:
      "Cálculo multi-estanque corrupto: una zona consume de un estanque imposible.",
    query_hint:
      "SELECT z.*, e.tipo AS estanque_tipo, e.terreno_id AS estanque_terreno FROM zonas z JOIN zonas e ON e.id = z.estanque_id WHERE z.estanque_id IS NOT NULL AND (e.terreno_id <> z.terreno_id OR e.tipo <> 'estanque')",
  };
};

/**
 * Pagina precios_historico en lotes de 1000 (Supabase server-side cap).
 * Sin paginar, audits sobre tablas grandes solo verían los primeros 1000.
 */
async function fetchPreciosHistorico(sb: SupabaseClient): Promise<
  Array<{
    id: string;
    nombre_odepa: string | null;
    region: string | null;
    fecha_odepa: string | null;
    unidad_comercializacion: string | null;
    precio_actual_clp: number | null;
    precio_kg_clp: number | null;
  }>
> {
  const PAGE = 1000;
  const all: Awaited<ReturnType<typeof fetchPreciosHistorico>> = [];
  let from = 0;
  while (true) {
    const { data, error } = await sb
      .from("precios_historico")
      .select(
        "id, nombre_odepa, region, fecha_odepa, unidad_comercializacion, precio_actual_clp, precio_kg_clp",
      )
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as typeof all));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

/**
 * Determina cómo debería convertirse el precio crudo a CLP/kg dado el string
 * de unidad ODEPA. Determinístico, no estadístico — refleja la realidad del
 * formato ODEPA, no asume nada de los datos.
 */
type Conversion =
  | { kind: "ya-por-kg"; expected: number } // precio crudo ya es por kg, no dividir
  | { kind: "dividir"; kg: number; expected: number } // dividir por contenedor
  | { kind: "no-convertible" }; // unidad/paquete/atado sin info de kg

function calcularExpected(
  unidad: string | null,
  raw: number | null,
): Conversion | null {
  if (raw == null || raw <= 0 || !unidad) return null;
  const u = unidad.toLowerCase().trim();

  // Caso 1: precio crudo YA es por kilo. No dividir aunque mencione kilos del contenedor.
  // Ej: "$/kilo (en caja de 17 kilos)" → expected = raw.
  if (u.startsWith("$/kilo") || u.startsWith("$/kg")) {
    return { kind: "ya-por-kg", expected: raw };
  }

  // Caso 2: la unidad contiene "N kilos" en algún lado → el peso del contenedor está declarado.
  // Toma la ÚLTIMA mención de kilos (la que típicamente describe el contenedor).
  // Cubre:
  //   "$/bandeja 10 kilos"             → kg=10
  //   "$/caja 18 kilos embalada"       → kg=18
  //   "$/atado 2,5 a 3 kilos"          → kg=3 (aprox conservadora del API)
  //   "$/bins (450 kilos)"             → kg=450
  const allKg = [...u.matchAll(/(\d+(?:[.,]\d+)?)\s*kg\b|(\d+(?:[.,]\d+)?)\s*kilos?\b|(\d+(?:[.,]\d+)?)\s*kilogramos?\b/gi)];
  if (allKg.length > 0) {
    const last = allKg[allKg.length - 1];
    const numStr = last[1] ?? last[2] ?? last[3];
    const kg = parseFloat(numStr.replace(",", "."));
    if (kg > 0) return { kind: "dividir", kg, expected: Math.round(raw / kg) };
  }

  // Caso 3: unidad sin info de kg ($/unidad, $/paquete, $/saco N unidades, etc).
  return { kind: "no-convertible" };
}

const preciosHistoricoConversion: CheckFn = async (sb) => {
  const data = await fetchPreciosHistorico(sb);

  const counts = {
    sin_unidad: 0,
    no_convertible: 0,
    ya_por_kg_ok: 0,
    ya_por_kg_bug: 0,
    dividir_ok: 0,
    dividir_bug: 0,
    parser_no_seteo: 0,
  };

  const bad = data
    .map((r) => {
      const conv = calcularExpected(
        r.unidad_comercializacion,
        r.precio_actual_clp,
      );
      if (conv == null) {
        counts.sin_unidad += 1;
        return null;
      }

      // Unidad no convertible (ej: $/unidad, $/paquete) — precio_kg_clp NULL es esperado.
      if (conv.kind === "no-convertible") {
        counts.no_convertible += 1;
        if (r.precio_kg_clp != null) {
          // Caso raro: el parser puso un valor cuando no debió.
          return {
            ...r,
            tipo_bug: "no-convertible-pero-tiene-kg",
            razon: `unidad no convertible (${r.unidad_comercializacion}) pero precio_kg_clp=${r.precio_kg_clp}`,
          };
        }
        return null;
      }

      // Si la unidad SÍ es convertible pero el parser dejó NULL → bug.
      if (r.precio_kg_clp == null) {
        counts.parser_no_seteo += 1;
        return {
          ...r,
          tipo_bug: "parser-no-seteo",
          razon: `unidad convertible pero precio_kg_clp NULL (esperado: ${conv.expected})`,
          esperado: conv.expected,
        };
      }

      // Comparar esperado vs actual.
      const diff = Math.abs(r.precio_kg_clp - conv.expected);
      if (diff <= TOLERANCIA_CLP) {
        if (conv.kind === "ya-por-kg") counts.ya_por_kg_ok += 1;
        else counts.dividir_ok += 1;
        return null;
      }

      if (conv.kind === "ya-por-kg") {
        counts.ya_por_kg_bug += 1;
        return {
          ...r,
          tipo_bug: "ya-por-kg-pero-dividio",
          razon: `unidad "${r.unidad_comercializacion}" indica precio ya por kg ($${r.precio_actual_clp}); parser dividió y devolvió $${r.precio_kg_clp}`,
          esperado: conv.expected,
        };
      } else {
        counts.dividir_bug += 1;
        return {
          ...r,
          tipo_bug: "dividir-mal",
          razon: `unidad "${r.unidad_comercializacion}" pide raw/${conv.kg}; esperado $${conv.expected}, actual $${r.precio_kg_clp}`,
          esperado: conv.expected,
        };
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return {
    id: "precios-historico-conversion",
    statement:
      "precios_historico.precio_kg_clp coincide con conversión esperada según unidad_comercializacion",
    status: bad.length === 0 ? "ok" : "violation",
    count: bad.length,
    sample: bad.slice(0, SAMPLE_LIMIT),
    meaning: `Detecta el bug del adapter ODEPA en agriplan-api-nestjs cuando interpreta mal la unidad. Los buckets:
  • ya-por-kg-pero-dividio: unidad "$/kilo (en caja de N kilos)" — precio crudo es por kg, pero el parser dividió por N → datos 10-30x más bajos de lo real.
  • dividir-mal: unidad "$/bandeja N kilos" — parser no dividió, dejó precio crudo (datos 10-30x más altos).
  • parser-no-seteo: unidad declara kg pero precio_kg_clp NULL.
  • no-convertible-pero-tiene-kg: el parser asignó valor en una unidad que no debería convertirse.
Métricas detalladas en metrics.precio_kg_buckets.`,
    query_hint:
      "Conversión esperada se calcula en JS con regex sobre unidad_comercializacion. Ver función calcularExpected() en el script.",
    buckets: counts,
  };
};

const suscripcionesPeriodos: CheckFn = async (sb) => {
  const { data, error } = await sb
    .from("suscripciones")
    .select(
      "id, usuario_id, plan_id, current_period_start, current_period_end, canceled_at, cancel_at_period_end",
    )
    .limit(50000);
  if (error) throw error;

  const bad = (data ?? []).filter((s) => {
    const start = s.current_period_start ? new Date(s.current_period_start) : null;
    const end = s.current_period_end ? new Date(s.current_period_end) : null;
    const canceledAt = s.canceled_at ? new Date(s.canceled_at) : null;
    if (start && end && start >= end) return true;
    if (canceledAt && end && canceledAt > end) return true;
    return false;
  });
  return {
    id: "suscripciones-periodos-validos",
    statement:
      "suscripciones: start < end, y canceled_at ≤ end si está set",
    status: bad.length === 0 ? "ok" : "violation",
    count: bad.length,
    sample: bad.slice(0, SAMPLE_LIMIT),
    meaning:
      "Estado de billing inconsistente — usuarios con escrituras autorizadas tras vencer su período, o canceladas en futuro imposible.",
    query_hint:
      "SELECT * FROM suscripciones WHERE current_period_start >= current_period_end OR canceled_at > current_period_end",
  };
};

const INVARIANTS: { name: string; fn: CheckFn }[] = [
  { name: "plantas-cultivo-orphan", fn: plantasCultivoOrphan },
  { name: "cosechas-cultivo-orphan", fn: cosechasCultivoOrphan },
  { name: "catalogo-nombre-drift", fn: catalogoNombreDrift },
  { name: "sesiones-terreno-mismatch", fn: sesionesRiegoTerrenoMismatch },
  { name: "zona-estanque-valido", fn: zonaEstanqueValido },
  { name: "precios-historico-conversion", fn: preciosHistoricoConversion },
  { name: "suscripciones-periodos", fn: suscripcionesPeriodos },
];

// ─── Runner ──────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const findings: InvariantResult[] = [];

  for (const { name, fn } of INVARIANTS) {
    try {
      findings.push(await fn(sb));
    } catch (err) {
      findings.push({
        id: name,
        statement: "(error al ejecutar)",
        status: "error",
        count: -1,
        sample: [],
        meaning: (err as Error).message,
        query_hint: "",
      });
    }
  }

  const violations = findings.filter((f) => f.status === "violation");
  const errors = findings.filter((f) => f.status === "error");
  const ok = findings.filter((f) => f.status === "ok");

  const reportStatus =
    errors.length > 0 ? "fail" : violations.length > 0 ? "warn" : "ok";
  const summary = `${ok.length}/${findings.length} invariantes OK | ${violations.length} con findings${errors.length > 0 ? ` | ${errors.length} con error` : ""}`;

  const runAt = new Date().toISOString();
  const report = {
    audit: "integridad-dominio",
    run_at: runAt,
    status: reportStatus,
    summary,
    findings,
    metrics: {
      total_invariants: findings.length,
      ok: ok.length,
      violations: violations.length,
      errors: errors.length,
      total_violation_rows: findings.reduce(
        (acc, f) => acc + Math.max(0, f.count),
        0,
      ),
    },
  };

  const here = dirname(fileURLToPath(import.meta.url));
  const dir = join(here, "reports", "integridad-dominio");
  mkdirSync(dir, { recursive: true });
  const tsSafe = runAt.replace(/[:.]/g, "-");
  const json = JSON.stringify(report, null, 2);
  writeFileSync(join(dir, `${tsSafe}.json`), json);
  writeFileSync(join(dir, "latest.json"), json);

  console.log(`\n${summary}`);
  console.log(
    `Reporte: scripts/safe/audit/reports/integridad-dominio/latest.json\n`,
  );
  for (const f of findings) {
    const icon = f.status === "ok" ? "✓" : f.status === "violation" ? "✗" : "!";
    const tail = f.count > 0 ? ` (${f.count} filas)` : "";
    console.log(`  ${icon} ${f.statement}${tail}`);
    if (f.status === "error") console.log(`      → ${f.meaning}`);
  }
  console.log("");

  process.exit(reportStatus === "fail" ? 1 : 0);
}

main().catch((e) => {
  console.error("Error fatal:", (e as Error).message);
  process.exit(2);
});
