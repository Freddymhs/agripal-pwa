-- Support the etapa_actual column used by the realistic terreno seed so plants track their lifecycle.
ALTER TABLE plantas
  ADD COLUMN IF NOT EXISTS etapa_actual TEXT;
