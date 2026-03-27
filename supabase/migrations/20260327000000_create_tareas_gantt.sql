-- Tabla de tareas manuales del calendario Gantt
-- Permite al usuario registrar eventos/tareas por rango de fechas asociadas a un terreno.
--
-- Columnas explícitas (sincronizadas con schema.ts → COLUMNAS_EXPLICITAS.tareas_gantt):
--   id, usuario_id, proyecto_id, terreno_id, titulo, fecha_inicio, fecha_fin, color
-- El resto de campos opcionales van al bucket JSONB `datos`.

CREATE TABLE IF NOT EXISTS tareas_gantt (
  id          UUID         PRIMARY KEY,
  usuario_id  UUID         NOT NULL REFERENCES auth.users(id)  ON DELETE CASCADE,
  proyecto_id UUID         NOT NULL REFERENCES proyectos(id)   ON DELETE CASCADE,
  terreno_id  UUID         NOT NULL REFERENCES terrenos(id)    ON DELETE CASCADE,
  titulo      TEXT         NOT NULL,
  fecha_inicio TIMESTAMPTZ NOT NULL,
  fecha_fin    TIMESTAMPTZ NOT NULL,
  color        TEXT        NOT NULL DEFAULT 'emerald',
  datos        JSONB       NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_tareas_gantt_terreno_id  ON tareas_gantt(terreno_id);
CREATE INDEX IF NOT EXISTS idx_tareas_gantt_proyecto_id ON tareas_gantt(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_tareas_gantt_usuario_id  ON tareas_gantt(usuario_id);
CREATE INDEX IF NOT EXISTS idx_tareas_gantt_fechas      ON tareas_gantt(fecha_inicio, fecha_fin);

-- Row Level Security
ALTER TABLE tareas_gantt ENABLE ROW LEVEL SECURITY;

-- Solo el propietario puede leer/escribir sus propias tareas
CREATE POLICY IF NOT EXISTS "tareas_gantt_owner_select"
  ON tareas_gantt FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY IF NOT EXISTS "tareas_gantt_owner_insert"
  ON tareas_gantt FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY IF NOT EXISTS "tareas_gantt_owner_update"
  ON tareas_gantt FOR UPDATE
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY IF NOT EXISTS "tareas_gantt_owner_delete"
  ON tareas_gantt FOR DELETE
  USING (auth.uid() = usuario_id);
