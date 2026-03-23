-- Tabla para publicaciones INIA DSpace sincronizadas por la API
-- La API (agriplan-api-nestjs) escribe aquí via cron semanal
-- La PWA puede leer para mostrar recomendaciones técnicas

CREATE TABLE IF NOT EXISTS publicaciones_inia (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle            TEXT UNIQUE NOT NULL,
  titulo            TEXT NOT NULL,
  anio              INTEGER,
  tipo              TEXT,
  resumen           TEXT,
  cobertura_espacial TEXT,
  temas             TEXT[],
  url_biblioteca    TEXT NOT NULL,
  acceso            TEXT NOT NULL DEFAULT 'open.access',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS publicaciones_inia_cobertura_idx ON publicaciones_inia (cobertura_espacial);
CREATE INDEX IF NOT EXISTS publicaciones_inia_tipo_idx ON publicaciones_inia (tipo);
