CREATE TABLE IF NOT EXISTS clima_diario (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ubicacion_id TEXT NOT NULL,
  fecha DATE NOT NULL,
  temperatura_max DOUBLE PRECISION,
  temperatura_min DOUBLE PRECISION,
  temperatura_media DOUBLE PRECISION,
  humedad_relativa DOUBLE PRECISION,
  precipitacion DOUBLE PRECISION,
  velocidad_viento DOUBLE PRECISION,
  radiacion_solar DOUBLE PRECISION,
  et0 DOUBLE PRECISION,
  snapshots INTEGER NOT NULL DEFAULT 1,
  actualizado_en TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ubicacion_id, fecha)
);

CREATE INDEX IF NOT EXISTS clima_diario_ubicacion_fecha_idx ON clima_diario (ubicacion_id, fecha);
