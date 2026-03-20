-- ============================================================
-- AgriPlan PWA — Refactor precios (PLAN_PRECIOS.md)
--
-- 1. Renombrar precios_base → precios_mayoristas
-- 2. Agregar columnas explícitas para API (ODEPA escribe directo)
-- 3. Crear mercado_detalle (inteligencia de mercado separada)
-- ============================================================

-- ─── PASO 1: Renombrar tabla ────────────────────────────────

ALTER TABLE IF EXISTS precios_base RENAME TO precios_mayoristas;

-- ─── PASO 2: Agregar columnas que el API necesita ──────────

ALTER TABLE precios_mayoristas
  ADD COLUMN IF NOT EXISTS cultivo_id TEXT,
  ADD COLUMN IF NOT EXISTS region TEXT NOT NULL DEFAULT 'arica',
  ADD COLUMN IF NOT EXISTS nombre_odepa TEXT,
  ADD COLUMN IF NOT EXISTS precio_min_clp INTEGER,
  ADD COLUMN IF NOT EXISTS precio_max_clp INTEGER,
  ADD COLUMN IF NOT EXISTS precio_actual_clp INTEGER,
  ADD COLUMN IF NOT EXISTS tendencia TEXT,
  ADD COLUMN IF NOT EXISTS actualizado_en TEXT,
  ADD COLUMN IF NOT EXISTS fuente TEXT;

-- ─── PASO 3: Actualizar RLS (nombre de tabla cambió) ───────

DROP POLICY IF EXISTS "precios_base_read" ON precios_mayoristas;

CREATE POLICY "precios_mayoristas_read" ON precios_mayoristas
  FOR SELECT TO authenticated USING (true);

-- ─── PASO 4: Crear mercado_detalle ────────────────────────

CREATE TABLE IF NOT EXISTS mercado_detalle (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  precio_mayorista_id TEXT NOT NULL UNIQUE REFERENCES precios_mayoristas(id) ON DELETE CASCADE,
  demanda_local         TEXT,
  competencia_local     TEXT,
  mercado_exportacion   BOOLEAN DEFAULT false,
  notas                 TEXT,
  actualizado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE mercado_detalle ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mercado_detalle_read" ON mercado_detalle
  FOR SELECT TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_mercado_detalle_mayoristas
  ON mercado_detalle(precio_mayorista_id);

CREATE INDEX IF NOT EXISTS idx_precios_mayoristas_region
  ON precios_mayoristas(region);

CREATE INDEX IF NOT EXISTS idx_precios_mayoristas_cultivo
  ON precios_mayoristas(cultivo_id);
