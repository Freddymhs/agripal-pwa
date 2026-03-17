-- Elimina la asignación automática de clima_base_id en proyectos nuevos.
-- El usuario debe elegir explícitamente su región climática.
-- Esto permite que la alerta "clima_no_configurado" se dispare correctamente.

-- 1. Quitar el default automático del trigger de copia de catálogo
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

  -- clima_base_id queda NULL — el usuario lo elige en Avanzado > Clima

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Poner NULL en todos los proyectos existentes para que el usuario elija
UPDATE proyectos SET clima_base_id = NULL;
