-- ============================================================
-- AgriPlan PWA — Fix arquitectural (007)
--
--   1. Clima: elimina clima_proyecto, agrega FK directa
--             proyectos.clima_base_id → clima_base
--
--   2. Insumos: mueve insumos_catalogo de per-proyecto
--               a per-terreno (terreno_id en lugar de proyecto_id)
-- ============================================================

-- ─── 1. Agregar clima_base_id a proyectos ─────────────────────────────────────

ALTER TABLE proyectos
  ADD COLUMN IF NOT EXISTS clima_base_id TEXT
    REFERENCES clima_base(id);

-- Rellenar proyectos existentes
UPDATE proyectos
SET clima_base_id = (SELECT id FROM clima_base ORDER BY id LIMIT 1)
WHERE clima_base_id IS NULL;

-- ─── 2. Eliminar clima_proyecto ───────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_single_active_clima ON clima_proyecto;
DROP FUNCTION IF EXISTS ensure_single_active_clima();
DROP FUNCTION IF EXISTS default_clima_base_id();
DROP TABLE IF EXISTS clima_proyecto;

-- ─── 3. Actualizar trigger copiar_catalogo_base_a_proyecto ────────────────────
--    (sin copia de clima ni insumos)

CREATE OR REPLACE FUNCTION copiar_catalogo_base_a_proyecto()
RETURNS TRIGGER AS $$
BEGIN
  -- Cultivos
  INSERT INTO catalogo_cultivos (proyecto_id, nombre, tier, datos)
  SELECT NEW.id, nombre, tier, datos FROM catalogo_base;

  -- Enmiendas
  INSERT INTO enmiendas_proyecto (proyecto_id, nombre, tipo, datos)
  SELECT NEW.id, nombre, tipo, datos FROM enmiendas_base;

  -- Tecnicas
  INSERT INTO tecnicas_proyecto (proyecto_id, nombre, categoria, datos)
  SELECT NEW.id, nombre, categoria, datos FROM tecnicas_base;

  -- Fuentes de agua
  INSERT INTO fuentes_agua_proyecto (proyecto_id, nombre, tipo, datos)
  SELECT NEW.id, nombre, tipo, datos FROM fuentes_agua_base;

  -- Asignar primer clima_base como default al nuevo proyecto
  UPDATE proyectos
  SET clima_base_id = (SELECT id FROM clima_base ORDER BY id LIMIT 1)
  WHERE id = NEW.id AND clima_base_id IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 4. Mover insumos_catalogo a per-terreno ──────────────────────────────────

-- Borrar política RLS que depende de proyecto_id
DROP POLICY IF EXISTS user_owns_insumos_catalogo ON insumos_catalogo;

ALTER TABLE insumos_catalogo
  DROP COLUMN IF EXISTS proyecto_id CASCADE;

ALTER TABLE insumos_catalogo
  ADD COLUMN terreno_id UUID NOT NULL
    REFERENCES terrenos(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_insumos_catalogo_terreno
  ON insumos_catalogo(terreno_id);

-- Recrear política RLS usando terreno_id (via terrenos → proyecto → usuario)
CREATE POLICY user_owns_insumos_catalogo ON insumos_catalogo
  USING (
    terreno_id IN (
      SELECT t.id FROM terrenos t
      JOIN proyectos p ON t.proyecto_id = p.id
      WHERE p.usuario_id = auth.uid()
    )
  );

-- ─── 5. Trigger en terrenos para copiar insumos_base ─────────────────────────

CREATE OR REPLACE FUNCTION copiar_insumos_base_a_terreno()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO insumos_catalogo (terreno_id, nombre, tipo, datos)
  SELECT NEW.id, nombre, tipo, datos FROM insumos_base;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_copiar_insumos_terreno ON terrenos;
CREATE TRIGGER trg_copiar_insumos_terreno
  AFTER INSERT ON terrenos
  FOR EACH ROW
  EXECUTE FUNCTION copiar_insumos_base_a_terreno();
