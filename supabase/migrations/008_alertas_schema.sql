-- Migración: ampliar tabla alertas para soportar alertas de proyecto y referencias opcionales

-- 1. Hacer terreno_id nullable (alertas de proyecto no tienen terreno específico)
ALTER TABLE alertas
  ALTER COLUMN terreno_id DROP NOT NULL;

-- 2. Agregar columnas faltantes
ALTER TABLE alertas
  ADD COLUMN IF NOT EXISTS proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS zona_id UUID REFERENCES zonas(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS planta_id UUID REFERENCES plantas(id) ON DELETE SET NULL;

-- 3. Índices para las nuevas FKs
CREATE INDEX IF NOT EXISTS idx_alertas_proyecto ON alertas(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_alertas_zona ON alertas(zona_id);
CREATE INDEX IF NOT EXISTS idx_alertas_planta ON alertas(planta_id);

-- 4. Actualizar RLS policy para incluir alertas de proyecto
DROP POLICY IF EXISTS "user_owns_alerta" ON alertas;

CREATE POLICY "user_owns_alerta" ON alertas
  FOR ALL USING (
    (
      terreno_id IS NOT NULL AND
      terreno_id IN (
        SELECT t.id FROM terrenos t
        JOIN proyectos p ON p.id = t.proyecto_id
        WHERE p.usuario_id = auth.uid()
      )
    ) OR (
      proyecto_id IS NOT NULL AND
      proyecto_id IN (
        SELECT id FROM proyectos WHERE usuario_id = auth.uid()
      )
    )
  );

-- 5. Constraint: al menos terreno_id o proyecto_id debe estar presente
ALTER TABLE alertas
  ADD CONSTRAINT alertas_tiene_owner
  CHECK (terreno_id IS NOT NULL OR proyecto_id IS NOT NULL);
