-- ============================================================
-- AgriPlan PWA — Clima activo por proyecto (FASE Agua fixes)
--
-- Agrega columna `activo` a clima_proyecto para que cada
-- proyecto pueda seleccionar su región climática.
-- ============================================================

ALTER TABLE clima_proyecto
  ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT FALSE;

-- Función para asegurar que solo haya un clima activo por proyecto
CREATE OR REPLACE FUNCTION ensure_single_active_clima()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.activo = TRUE THEN
    UPDATE clima_proyecto
    SET activo = FALSE
    WHERE proyecto_id = NEW.proyecto_id
      AND id != NEW.id
      AND activo = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_single_active_clima
  BEFORE INSERT OR UPDATE OF activo ON clima_proyecto
  FOR EACH ROW
  WHEN (NEW.activo = TRUE)
  EXECUTE FUNCTION ensure_single_active_clima();

-- Activar el primer clima de cada proyecto existente que no tenga ninguno activo
UPDATE clima_proyecto cp
SET activo = TRUE
WHERE cp.id = (
  SELECT id FROM clima_proyecto
  WHERE proyecto_id = cp.proyecto_id
  ORDER BY created_at ASC
  LIMIT 1
)
AND NOT EXISTS (
  SELECT 1 FROM clima_proyecto
  WHERE proyecto_id = cp.proyecto_id AND activo = TRUE
);

-- Actualizar trigger de copia para marcar el primer clima como activo
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

  -- Clima (copia todos; marca el primero como activo)
  INSERT INTO clima_proyecto (proyecto_id, region, datos, activo)
  SELECT NEW.id, region, datos,
    (ROW_NUMBER() OVER (ORDER BY id) = 1) AS activo
  FROM clima_base;

  -- Fuentes de agua
  INSERT INTO fuentes_agua_proyecto (proyecto_id, nombre, tipo, datos)
  SELECT NEW.id, nombre, tipo, datos FROM fuentes_agua_base;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
