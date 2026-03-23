-- Agrega cultivo_id a publicaciones_inia para asociar cada publicación con un cultivo específico.
-- Usado por el cron de la API (agriplan-api-nestjs) que sincroniza INIA buscando por nombre de cultivo.
-- cultivo_id referencia catalogo_base.id (TEXT). NULL = publicación sin cultivo específico asignado.

ALTER TABLE publicaciones_inia
  ADD COLUMN IF NOT EXISTS cultivo_id TEXT;

CREATE INDEX IF NOT EXISTS publicaciones_inia_cultivo_id_idx ON publicaciones_inia (cultivo_id);
