-- ============================================================
-- Migración 017: Indexes faltantes en FKs existentes
--
-- zonas.estanque_id (desde migración 002)
-- suscripciones.plan_id (desde migración 003)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_zonas_estanque_id
  ON zonas(estanque_id);

CREATE INDEX IF NOT EXISTS idx_suscripciones_plan
  ON suscripciones(plan_id);
