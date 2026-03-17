CREATE TABLE IF NOT EXISTS sesiones_riego (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zona_id UUID NOT NULL REFERENCES zonas(id) ON DELETE CASCADE,
  terreno_id UUID NOT NULL REFERENCES terrenos(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  hora_inicio TIME,
  duracion_horas DECIMAL(5,2) NOT NULL,
  caudal_lh DECIMAL(10,2) NOT NULL,
  consumo_litros DECIMAL(10,2) NOT NULL,
  notas TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sesiones_riego_zona_id ON sesiones_riego(zona_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_riego_terreno_id ON sesiones_riego(terreno_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_riego_fecha ON sesiones_riego(fecha DESC);
