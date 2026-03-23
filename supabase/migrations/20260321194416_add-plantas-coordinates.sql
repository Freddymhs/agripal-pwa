-- Add x/y location columns so planta rows can store absolute coordinates for the map seed.
ALTER TABLE plantas
  ADD COLUMN IF NOT EXISTS x NUMERIC,
  ADD COLUMN IF NOT EXISTS y NUMERIC;
