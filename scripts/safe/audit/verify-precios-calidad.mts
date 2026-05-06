/**
 * verify-precios-calidad.mts — Verifica calidad de precios_actual + compara vs ODEPA live.
 *
 * Uso:
 *   pnpm audit:precios               # estado actual + rango
 *   pnpm audit:precios --compare     # además descarga ODEPA y compara % diff
 *
 * Qué revisa:
 *   1. Distribución de fuentes (odepa/seed/investigacion/estimado)
 *   2. Precios fuera de rango realista [MIN, MAX] CLP/kg
 *   3. Frescura: cuándo fue el último update por ODEPA
 *   4. (--compare) Descarga ODEPA, recalcula CLP/kg y compara vs lo almacenado
 *
 * Guarda reporte en scripts/safe/audit/reports/verify-precios/TIMESTAMP.json
 * Siempre sobreescribe latest.json para consulta rápida.
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = join(__dir, 'reports', 'verify-precios');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(2);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Configuración ────────────────────────────────────────────────────────────

const ODEPA_BASE   = 'https://datos.odepa.gob.cl/api/3/action';
const PACKAGE_ID   = 'precios-mayoristas-de-frutas-y-hortalizas';
const REGION_ARICA = 'Región de Arica y Parinacota';

// Rango realista por cultivo. Si no está en el mapa → se usa 'default'.
// Actualizar si ODEPA reporta sistemáticamente valores fuera de este rango.
const RANGO_CLP_KG: Record<string, [min: number, max: number]> = {
  default:    [100, 20_000],
  Cebolla:    [100,  3_000],
  Tomate:     [150,  2_500],
  Ají:        [500,  6_000],
  Limón:      [400,  5_000],
  Ajo:        [500,  8_000],
  Uva:        [300,  5_000],
  Mandarina:  [300,  4_000],
  Choclo:     [200,  3_000],
  Zapallo:    [100,  2_500],
  Camote:     [200,  4_000],
  Arándano:   [800, 15_000],
  Quínoa:     [800, 20_000],
  Mango:      [500,  8_000],
  Maracuyá:   [400,  6_000],
};

const DIFF_WARN_PCT = 40; // % diferencia vs ODEPA live que activa alerta

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseKgDesdeUnidad(unidad: string | null): number | null {
  if (!unidad) return null;
  const u = unidad.trim().toLowerCase();
  if (/^\$\/(?:kg|kilog?r?a?m?o?s?)\b/.test(u)) return 1;
  const matches = [...u.matchAll(/(\d+(?:[.,]\d+)?)\s*(?:kg\b|kilog?r?a?m?o?s?\b)/gi)];
  if (!matches.length) return null;
  const numStr = matches[matches.length - 1]?.[1];
  if (!numStr) return null;
  const kg = parseFloat(numStr.replace(',', '.'));
  return isNaN(kg) || kg <= 0 ? null : kg;
}

function parseOdepaDecimal(value: string | null | undefined): number {
  if (!value) return 0;
  return Number(value.replace(/\./g, '').replace(',', '.')) || 0;
}

function rangoParaCultivo(nombre: string): [number, number] {
  for (const [key, rango] of Object.entries(RANGO_CLP_KG)) {
    if (key !== 'default' && nombre.toLowerCase().includes(key.toLowerCase())) {
      return rango;
    }
  }
  return RANGO_CLP_KG.default;
}

function pct(stored: number, fresh: number): number {
  return Math.round(Math.abs(stored - fresh) / fresh * 100);
}

// ─── ODEPA CKAN fetch ─────────────────────────────────────────────────────────

async function getResourceId(year: number): Promise<string | null> {
  const res = await fetch(`${ODEPA_BASE}/package_show?id=${PACKAGE_ID}`);
  const json = (await res.json()) as { success: boolean; result: { resources: { id: string; name: string }[] } };
  if (!json.success) return null;
  for (const r of json.result.resources) {
    const m = r.name.match(/(\d{4})/);
    if (m && Number(m[1]) === year) return r.id;
  }
  return null;
}

async function fetchOdepaPreciosArica(year: number): Promise<Map<string, number>> {
  const resourceId = await getResourceId(year);
  if (!resourceId) {
    console.warn(`⚠️  No hay resource_id para año ${year} en ODEPA`);
    return new Map();
  }

  const map        = new Map<string, number>();
  const latestDate = new Map<string, string>();
  let offset = 0;

  while (true) {
    const params = new URLSearchParams({
      resource_id: resourceId,
      limit: '100',
      offset: String(offset),
      filters: JSON.stringify({ Region: REGION_ARICA }),
    });

    const res  = await fetch(`${ODEPA_BASE}/datastore_search?${params}`);
    const json = (await res.json()) as { success: boolean; result: { records: Record<string, string>[] } };

    if (!json.success || !json.result.records.length) break;

    for (const r of json.result.records) {
      const raw = parseOdepaDecimal(r['Precio promedio']);
      if (raw <= 0) continue;
      const kg = parseKgDesdeUnidad(r['Unidad de comercializacion']);
      if (!kg || kg <= 0) continue;
      const precioKg = Math.round(raw / kg);
      const nombre   = r.Producto?.trim() ?? '';
      const fecha    = r.Fecha ?? '';
      if (!latestDate.has(nombre) || fecha > latestDate.get(nombre)!) {
        latestDate.set(nombre, fecha);
        map.set(nombre.toLowerCase(), precioKg);
      }
    }

    if (json.result.records.length < 100) break;
    offset += 100;
  }

  console.log(`  ODEPA CKAN Arica ${year}: ${map.size} productos con precio/kg calculable`);
  return map;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const withCompare = process.argv.includes('--compare');

console.log('\n╔══════════════════════════════════════════════════════╗');
console.log('║  VERIFICACIÓN CALIDAD PRECIOS — precios_actual       ║');
if (withCompare) {
  console.log('║  Modo: comparación live vs ODEPA CKAN                ║');
}
console.log('╚══════════════════════════════════════════════════════╝\n');

const { data: rows, error } = await sb
  .from('precios_actual')
  .select('cultivo_id, region, nombre_odepa, precio_actual_clp, precio_min_clp, precio_max_clp, fuente, actualizado_en')
  .order('fuente')
  .order('nombre_odepa');

if (error) { console.error('Error Supabase:', error.message); process.exit(1); }

// ─── 1. Distribución de fuentes ──────────────────────────────────────────────

const byFuente = (rows ?? []).reduce<Record<string, number>>((acc, r) => {
  acc[r.fuente ?? 'null'] = (acc[r.fuente ?? 'null'] ?? 0) + 1;
  return acc;
}, {});

console.log('1. DISTRIBUCIÓN DE FUENTES');
for (const [f, n] of Object.entries(byFuente)) {
  const bar = '█'.repeat(n);
  console.log(`   ${f.padEnd(15)} ${String(n).padStart(3)} cultivos  ${bar}`);
}
console.log();

// ─── 2. Frescura (cuándo se actualizó por última vez desde ODEPA) ─────────────

const STALE_HOURS = 13; // cron corre cada 6h → si pasan >13h algo falló
const odepaRows = (rows ?? []).filter(r => r.fuente === 'odepa');
if (odepaRows.length) {
  const fechas      = odepaRows.map(r => r.actualizado_en).filter(Boolean).sort().reverse();
  const masReciente = fechas[0] ? new Date(fechas[0]) : null;
  const masAntigua  = fechas[fechas.length - 1] ? new Date(fechas[fechas.length - 1]) : null;
  const ahoraMs     = Date.now();
  const horasDesdeUpdate = masReciente ? (ahoraMs - masReciente.getTime()) / 3_600_000 : Infinity;
  const stale = horasDesdeUpdate > STALE_HOURS;

  console.log(`2. FRESCURA (filas con fuente='odepa': ${odepaRows.length})`);
  console.log(`   Más reciente: ${masReciente?.toLocaleString('es-CL') ?? 'desconocida'}  (hace ${horasDesdeUpdate.toFixed(1)}h)`);
  console.log(`   Más antigua:  ${masAntigua?.toLocaleString('es-CL') ?? 'desconocida'}`);
  if (stale) {
    console.log(`   ⚠️  STALE — datos de hace ${horasDesdeUpdate.toFixed(0)}h. El cron debería correr cada 6h.`);
    console.log(`      Acción: curl https://agriplan-api.fmarcos.dev/api/v1/precios/sync`);
  } else {
    console.log(`   ✅ Frescos`);
  }
  console.log();
}

// ─── 3. Rango realista ───────────────────────────────────────────────────────

console.log('3. PRECIOS FUERA DE RANGO REALISTA');
const outliers: typeof rows = [];
for (const r of rows ?? []) {
  if (!r.precio_actual_clp || !r.nombre_odepa) continue;
  const [min, max] = rangoParaCultivo(r.nombre_odepa);
  if (r.precio_actual_clp < min || r.precio_actual_clp > max) {
    outliers.push(r);
    console.log(`   ⚠️  ${(r.nombre_odepa ?? '').padEnd(20)} ${r.precio_actual_clp} CLP/kg  (rango esperado: ${min}–${max})`);
  }
}
if (!outliers.length) console.log('   ✅ Todos dentro de rango');
console.log();

// ─── 4. Tabla resumen ────────────────────────────────────────────────────────

console.log('4. PRECIOS ACTUALES (CLP/kg)');
console.log('   ' + 'nombre_odepa'.padEnd(22) + 'min    actual max    fuente');
console.log('   ' + '─'.repeat(60));
for (const r of rows ?? []) {
  if (!r.nombre_odepa) continue;
  const min    = String(r.precio_min_clp ?? '-').padEnd(7);
  const actual = String(r.precio_actual_clp ?? '-').padEnd(7);
  const max    = String(r.precio_max_clp ?? '-').padEnd(7);
  console.log(`   ${(r.nombre_odepa).padEnd(22)}${min}${actual}${max}${r.fuente}`);
}
console.log();

// ─── 5. Comparación live ODEPA (--compare) ───────────────────────────────────

type CompareRow = {
  nombre: string;
  stored: number;
  fresh: number;
  diff_pct: number;
  status: 'ok' | 'warn' | 'error';
};
const compareResults: CompareRow[] = [];

if (withCompare) {
  console.log('5. COMPARACIÓN vs ODEPA LIVE (descargando datos…)');
  const year      = new Date().getFullYear();
  const odepaMapa = await fetchOdepaPreciosArica(year);
  console.log();

  for (const r of rows ?? []) {
    if (r.fuente !== 'odepa' || !r.nombre_odepa || !r.precio_actual_clp) continue;
    const freshKg = odepaMapa.get(r.nombre_odepa.toLowerCase());
    if (!freshKg) continue;
    const diff = pct(r.precio_actual_clp, freshKg);
    const status: CompareRow['status'] = diff > DIFF_WARN_PCT ? 'warn' : 'ok';
    compareResults.push({ nombre: r.nombre_odepa, stored: r.precio_actual_clp, fresh: freshKg, diff_pct: diff, status });
    const icon = status === 'ok' ? '✅' : '⚠️ ';
    console.log(`   ${icon} ${r.nombre_odepa.padEnd(20)} stored:${String(r.precio_actual_clp).padStart(6)}  fresh:${String(freshKg).padStart(6)}  diff:${diff}%`);
  }
  if (!compareResults.length) console.log('   (sin datos comparables)');
  console.log();
}

// ─── Guardar reporte ─────────────────────────────────────────────────────────

mkdirSync(REPORTS_DIR, { recursive: true });

const report = {
  run_at:    new Date().toISOString(),
  mode:      withCompare ? 'compare' : 'quick',
  fuentes:   byFuente,
  outliers:  outliers?.map(r => ({ nombre: r.nombre_odepa, precio: r.precio_actual_clp, fuente: r.fuente })) ?? [],
  compare:   compareResults,
  status:    outliers?.length || compareResults.some(c => c.status === 'warn') ? 'warn' : 'ok',
};

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
writeFileSync(join(REPORTS_DIR, `${timestamp}.json`), JSON.stringify(report, null, 2));
writeFileSync(join(REPORTS_DIR, 'latest.json'), JSON.stringify(report, null, 2));

console.log(`Reporte guardado → scripts/safe/audit/reports/verify-precios/latest.json`);
console.log(`Estado global: ${report.status === 'ok' ? '✅ OK' : '⚠️  REVISAR'}\n`);
