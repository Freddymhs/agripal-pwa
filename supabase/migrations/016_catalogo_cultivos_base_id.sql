-- ============================================================
-- Migración 016: cultivo_base_id en catalogo_cultivos
--
-- Preserva el ID original de catalogo_base en catalogo_cultivos
-- para poder hacer JOIN con precios_mayoristas.cultivo_id (TEXT).
-- ============================================================

ALTER TABLE catalogo_cultivos
  ADD COLUMN IF NOT EXISTS cultivo_base_id TEXT REFERENCES catalogo_base(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_catalogo_cultivos_base_id
  ON catalogo_cultivos(cultivo_base_id);

-- Poblar para registros ya existentes (match por nombre)
UPDATE catalogo_cultivos cc
SET cultivo_base_id = cb.id
FROM catalogo_base cb
WHERE cc.nombre = cb.nombre
  AND cc.cultivo_base_id IS NULL;

-- Actualizar trigger: incluir cultivo_base_id al copiar
CREATE OR REPLACE FUNCTION copiar_catalogo_base_a_proyecto()
RETURNS TRIGGER AS $$
BEGIN
  -- Copiar cultivos preservando el id base
  INSERT INTO catalogo_cultivos (proyecto_id, nombre, tier, kc_plantula, kc_joven, kc_adulta, kc_madura, datos, cultivo_base_id)
  SELECT NEW.id, nombre, tier, kc_plantula, kc_joven, kc_adulta, kc_madura, datos, id
  FROM catalogo_base;

  -- Crear config para cada cultivo copiado
  INSERT INTO catalogo_cultivos_config (cultivo_id, tipo, origen)
  SELECT cc.id, cb.tipo, cb.origen
  FROM catalogo_cultivos cc
  JOIN catalogo_base cb ON cc.cultivo_base_id = cb.id AND cc.proyecto_id = NEW.id;

  -- Copiar enmiendas, técnicas, fuentes de agua
  INSERT INTO enmiendas_proyecto (proyecto_id, nombre, tipo, datos)
  SELECT NEW.id, nombre, tipo, datos FROM enmiendas_base;

  INSERT INTO tecnicas_proyecto (proyecto_id, nombre, categoria, datos)
  SELECT NEW.id, nombre, categoria, datos FROM tecnicas_base;

  INSERT INTO fuentes_agua_proyecto (proyecto_id, nombre, tipo, datos)
  SELECT NEW.id, nombre, tipo, datos FROM fuentes_agua_base;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
