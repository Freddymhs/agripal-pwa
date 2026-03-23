-- Agrega factores de conversión para derivar precio feria y retail desde precio mayorista ODEPA.
-- precio_feria  = precio_actual_clp × factor_precio_feria  (lo que gana el agricultor en feria directa)
-- precio_retail = precio_actual_clp × factor_precio_retail (precio supermercado, referencia)
-- La API ODEPA no toca estas columnas — solo actualiza precio_actual_clp.

ALTER TABLE precios_mayoristas
  ADD COLUMN IF NOT EXISTS factor_precio_feria NUMERIC DEFAULT 2.0,
  ADD COLUMN IF NOT EXISTS factor_precio_retail NUMERIC DEFAULT 3.0;

COMMENT ON COLUMN precios_mayoristas.factor_precio_feria IS 'Multiplicador sobre precio_actual_clp para obtener precio venta en feria directa';
COMMENT ON COLUMN precios_mayoristas.factor_precio_retail IS 'Multiplicador sobre precio_actual_clp para obtener precio supermercado (referencia)';
