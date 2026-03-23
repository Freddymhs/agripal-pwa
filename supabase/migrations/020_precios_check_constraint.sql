-- ============================================================
-- AgriPlan PWA — Guard contra precios anómalos de ODEPA
--
-- ODEPA reporta precios por unidad comercial (caja, saco, bandeja).
-- El adapter convierte a CLP/kg, pero si falla el parsing
-- (e.g. "$/saco 50 unidades"), el precio raw puede escribirse
-- como si fuera por kg, resultando en valores 10-30x mayores.
--
-- Este CHECK constraint previene que precios_mayoristas acepte
-- valores absurdos. Techo: 15,000 CLP/kg (cubre aromáticas
-- premium como Orégano ~10k, Romero ~8k, con margen).
-- ============================================================

-- Constraint idempotente: DROP IF EXISTS + ADD
ALTER TABLE precios_mayoristas
  DROP CONSTRAINT IF EXISTS chk_precio_actual_rango;

ALTER TABLE precios_mayoristas
  ADD CONSTRAINT chk_precio_actual_rango
  CHECK (precio_actual_clp IS NULL OR (precio_actual_clp > 0 AND precio_actual_clp <= 15000));
