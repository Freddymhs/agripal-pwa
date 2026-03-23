-- Adds width metadata for terrenos so seeds can cache ancho_m.
ALTER TABLE terrenos
  ADD COLUMN IF NOT EXISTS ancho_m NUMERIC;
