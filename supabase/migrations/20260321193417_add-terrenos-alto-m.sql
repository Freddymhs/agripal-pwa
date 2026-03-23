-- Adds altitude metadata for terrenos so seeds can cache alto_m.
ALTER TABLE terrenos
  ADD COLUMN IF NOT EXISTS alto_m NUMERIC;
