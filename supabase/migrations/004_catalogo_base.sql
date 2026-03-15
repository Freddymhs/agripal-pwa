-- ============================================================
-- AgriPlan PWA — Catalogo base global (FASE 23)
--
-- catalogo_base: cultivos de referencia (poblar con seed-base).
-- variedades_base: variedades por cultivo (referencia global).
-- Al crear un proyecto nuevo, el trigger copia automaticamente
-- todos los cultivos base al catalogo personal del usuario.
-- ============================================================

-- Cultivos base (arica + huerto)
CREATE TABLE IF NOT EXISTS catalogo_base (
  id      TEXT PRIMARY KEY,
  nombre  TEXT NOT NULL,
  tier    TEXT NOT NULL DEFAULT 'base',
  datos   JSONB NOT NULL DEFAULT '{}'
);

ALTER TABLE catalogo_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "catalogo_base_read" ON catalogo_base
  FOR SELECT TO authenticated
  USING (true);

-- Variedades por cultivo
CREATE TABLE IF NOT EXISTS variedades_base (
  id          TEXT PRIMARY KEY,
  cultivo_id  TEXT NOT NULL REFERENCES catalogo_base(id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL,
  datos       JSONB NOT NULL DEFAULT '{}'
);

ALTER TABLE variedades_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "variedades_base_read" ON variedades_base
  FOR SELECT TO authenticated
  USING (true);

-- ============================================================
-- TRIGGER: al crear un proyecto, copiar catalogo_base
-- al catalogo personal del usuario en catalogo_cultivos
-- ============================================================
CREATE OR REPLACE FUNCTION copiar_catalogo_base_a_proyecto()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO catalogo_cultivos (proyecto_id, nombre, tier, datos)
  SELECT
    NEW.id,
    nombre,
    tier,
    datos
  FROM catalogo_base;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_proyecto_created
  AFTER INSERT ON proyectos
  FOR EACH ROW EXECUTE FUNCTION copiar_catalogo_base_a_proyecto();
