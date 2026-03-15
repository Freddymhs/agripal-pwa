-- ============================================================
-- AgriPlan PWA — Datos base globales (FASE 23 cont.)
--
-- Tablas base: referencia global (poblar con seed-base).
-- Tablas proyecto: copia personal por usuario, editable.
-- Al crear un proyecto, el trigger copia todo automaticamente.
-- ============================================================

-- ─── INSUMOS ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS insumos_base (
  id      TEXT PRIMARY KEY,
  nombre  TEXT NOT NULL,
  tipo    TEXT NOT NULL,
  datos   JSONB NOT NULL DEFAULT '{}'
);

ALTER TABLE insumos_base ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insumos_base_read" ON insumos_base
  FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS insumos_catalogo (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL,
  tipo        TEXT NOT NULL,
  datos       JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_insumos_catalogo_updated_at
  BEFORE UPDATE ON insumos_catalogo
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE insumos_catalogo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_owns_insumos_catalogo" ON insumos_catalogo
  FOR ALL USING (
    proyecto_id IN (SELECT id FROM proyectos WHERE usuario_id = auth.uid())
  );

-- ─── ENMIENDAS SUELO ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS enmiendas_base (
  id      TEXT PRIMARY KEY,
  nombre  TEXT NOT NULL,
  tipo    TEXT NOT NULL,
  datos   JSONB NOT NULL DEFAULT '{}'
);

ALTER TABLE enmiendas_base ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enmiendas_base_read" ON enmiendas_base
  FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS enmiendas_proyecto (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL,
  tipo        TEXT NOT NULL,
  datos       JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_enmiendas_proyecto_updated_at
  BEFORE UPDATE ON enmiendas_proyecto
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE enmiendas_proyecto ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_owns_enmiendas_proyecto" ON enmiendas_proyecto
  FOR ALL USING (
    proyecto_id IN (SELECT id FROM proyectos WHERE usuario_id = auth.uid())
  );

-- ─── TECNICAS ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tecnicas_base (
  id        TEXT PRIMARY KEY,
  nombre    TEXT NOT NULL,
  categoria TEXT NOT NULL,
  datos     JSONB NOT NULL DEFAULT '{}'
);

ALTER TABLE tecnicas_base ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tecnicas_base_read" ON tecnicas_base
  FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS tecnicas_proyecto (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL,
  categoria   TEXT NOT NULL,
  datos       JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_tecnicas_proyecto_updated_at
  BEFORE UPDATE ON tecnicas_proyecto
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE tecnicas_proyecto ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_owns_tecnicas_proyecto" ON tecnicas_proyecto
  FOR ALL USING (
    proyecto_id IN (SELECT id FROM proyectos WHERE usuario_id = auth.uid())
  );

-- ─── CLIMA ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS clima_base (
  id      TEXT PRIMARY KEY,
  region  TEXT NOT NULL,
  datos   JSONB NOT NULL DEFAULT '{}'
);

ALTER TABLE clima_base ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clima_base_read" ON clima_base
  FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS clima_proyecto (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  region      TEXT NOT NULL,
  datos       JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_clima_proyecto_updated_at
  BEFORE UPDATE ON clima_proyecto
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE clima_proyecto ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_owns_clima_proyecto" ON clima_proyecto
  FOR ALL USING (
    proyecto_id IN (SELECT id FROM proyectos WHERE usuario_id = auth.uid())
  );

-- ─── FUENTES DE AGUA ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fuentes_agua_base (
  id      TEXT PRIMARY KEY,
  nombre  TEXT NOT NULL,
  tipo    TEXT NOT NULL,
  datos   JSONB NOT NULL DEFAULT '{}'
);

ALTER TABLE fuentes_agua_base ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fuentes_agua_base_read" ON fuentes_agua_base
  FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS fuentes_agua_proyecto (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL,
  tipo        TEXT NOT NULL,
  datos       JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_fuentes_agua_proyecto_updated_at
  BEFORE UPDATE ON fuentes_agua_proyecto
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE fuentes_agua_proyecto ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_owns_fuentes_agua_proyecto" ON fuentes_agua_proyecto
  FOR ALL USING (
    proyecto_id IN (SELECT id FROM proyectos WHERE usuario_id = auth.uid())
  );

-- ─── PRECIOS (global, sin copia por usuario) ─────────────────

CREATE TABLE IF NOT EXISTS precios_base (
  id      TEXT PRIMARY KEY,
  nombre  TEXT NOT NULL,
  datos   JSONB NOT NULL DEFAULT '{}'
);

ALTER TABLE precios_base ENABLE ROW LEVEL SECURITY;
CREATE POLICY "precios_base_read" ON precios_base
  FOR SELECT TO authenticated USING (true);

-- ─── INDICES ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_insumos_catalogo_proyecto   ON insumos_catalogo(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_enmiendas_proyecto_proyecto ON enmiendas_proyecto(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_tecnicas_proyecto_proyecto  ON tecnicas_proyecto(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_clima_proyecto_proyecto     ON clima_proyecto(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_fuentes_agua_proyecto_proy  ON fuentes_agua_proyecto(proyecto_id);

-- ─── TRIGGER: extender copia al crear proyecto ───────────────

CREATE OR REPLACE FUNCTION copiar_catalogo_base_a_proyecto()
RETURNS TRIGGER AS $$
BEGIN
  -- Cultivos
  INSERT INTO catalogo_cultivos (proyecto_id, nombre, tier, datos)
  SELECT NEW.id, nombre, tier, datos FROM catalogo_base;

  -- Insumos
  INSERT INTO insumos_catalogo (proyecto_id, nombre, tipo, datos)
  SELECT NEW.id, nombre, tipo, datos FROM insumos_base;

  -- Enmiendas
  INSERT INTO enmiendas_proyecto (proyecto_id, nombre, tipo, datos)
  SELECT NEW.id, nombre, tipo, datos FROM enmiendas_base;

  -- Tecnicas
  INSERT INTO tecnicas_proyecto (proyecto_id, nombre, categoria, datos)
  SELECT NEW.id, nombre, categoria, datos FROM tecnicas_base;

  -- Clima (copia el registro de la region por defecto)
  INSERT INTO clima_proyecto (proyecto_id, region, datos)
  SELECT NEW.id, region, datos FROM clima_base;

  -- Fuentes de agua
  INSERT INTO fuentes_agua_proyecto (proyecto_id, nombre, tipo, datos)
  SELECT NEW.id, nombre, tipo, datos FROM fuentes_agua_base;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
