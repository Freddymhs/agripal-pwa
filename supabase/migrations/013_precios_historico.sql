-- ============================================================
-- AgriPlan — Historial de precios mayoristas
--
-- Guarda TODOS los registros que la API obtiene de ODEPA
-- en cada sync, independiente de si hay match con nuestro
-- catalogo. Nada se pierde.
-- ============================================================

CREATE TABLE IF NOT EXISTS precios_historico (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  precio_mayorista_id TEXT REFERENCES precios_mayoristas(id) ON DELETE SET NULL,
  nombre_odepa        TEXT NOT NULL,
  region              TEXT NOT NULL,
  mercado             TEXT,
  fecha_odepa         DATE NOT NULL,
  precio_min_clp      INTEGER,
  precio_max_clp      INTEGER,
  precio_actual_clp   INTEGER NOT NULL,
  fuente              TEXT NOT NULL DEFAULT 'odepa',
  synced_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE precios_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "precios_historico_read" ON precios_historico
  FOR SELECT TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_precios_historico_nombre_odepa
  ON precios_historico(nombre_odepa);

CREATE INDEX IF NOT EXISTS idx_precios_historico_region_fecha
  ON precios_historico(region, fecha_odepa DESC);

CREATE INDEX IF NOT EXISTS idx_precios_historico_mayorista
  ON precios_historico(precio_mayorista_id);
