-- ============================================================
-- Migración 018: Función para propagar cultivos nuevos
--
-- Cuando se agrega un cultivo a catalogo_base DESPUÉS de que
-- ya existen proyectos, esta función lo copia a todos los
-- proyectos que aún no lo tienen.
-- ============================================================

CREATE OR REPLACE FUNCTION propagar_cultivo_a_proyectos(p_cultivo_base_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  proyectos_actualizados INTEGER := 0;
BEGIN
  -- Copiar el cultivo a todos los proyectos que no lo tienen
  INSERT INTO catalogo_cultivos (proyecto_id, nombre, tier, kc_plantula, kc_joven, kc_adulta, kc_madura, datos, cultivo_base_id)
  SELECT p.id, cb.nombre, cb.tier, cb.kc_plantula, cb.kc_joven, cb.kc_adulta, cb.kc_madura, cb.datos, cb.id
  FROM proyectos p
  CROSS JOIN catalogo_base cb
  WHERE cb.id = p_cultivo_base_id
    AND NOT EXISTS (
      SELECT 1 FROM catalogo_cultivos cc
      WHERE cc.proyecto_id = p.id AND cc.cultivo_base_id = p_cultivo_base_id
    );

  GET DIAGNOSTICS proyectos_actualizados = ROW_COUNT;

  -- Crear config para los cultivos recién copiados
  INSERT INTO catalogo_cultivos_config (cultivo_id, tipo, origen)
  SELECT cc.id, cb.tipo, cb.origen
  FROM catalogo_cultivos cc
  JOIN catalogo_base cb ON cc.cultivo_base_id = cb.id
  WHERE cc.cultivo_base_id = p_cultivo_base_id
    AND NOT EXISTS (
      SELECT 1 FROM catalogo_cultivos_config ccc
      WHERE ccc.cultivo_id = cc.id
    );

  RETURN proyectos_actualizados;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION propagar_cultivo_a_proyectos IS
  'Copia un cultivo de catalogo_base a todos los proyectos existentes que no lo tienen';
