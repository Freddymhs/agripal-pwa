-- ============================================================
-- AgriPlan — Agregar conversión CLP/kg a precios_historico
--
-- ODEPA reporta precios por unidad comercial (caja, bandeja, etc.)
-- no por kg. Guardamos la unidad raw y el precio ya convertido.
-- ============================================================

ALTER TABLE precios_historico
  ADD COLUMN IF NOT EXISTS precio_kg_clp INTEGER,
  ADD COLUMN IF NOT EXISTS unidad_comercializacion TEXT;

COMMENT ON COLUMN precios_historico.precio_kg_clp IS
  'Precio convertido a CLP/kg. Null si no se pudo extraer kg_por_unidad.';

COMMENT ON COLUMN precios_historico.unidad_comercializacion IS
  'Cadena original de ODEPA, ej: "$/caja 24 kilos", "$/bandeja 18 kilos".';
