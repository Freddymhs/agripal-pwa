-- Rename tables to follow consistent _actual / _historico pattern.
-- *_actual  = single current row per entity, overwritten each sync by API cron.
-- *_historico = append-only time series, written by API cron only.

ALTER TABLE clima_base RENAME TO clima_actual;
ALTER TABLE clima_diario RENAME TO clima_historico;
ALTER TABLE precios_mayoristas RENAME TO precios_actual;
ALTER TABLE precios_mayoristas_config RENAME TO precios_actual_config;
ALTER TABLE proyectos RENAME COLUMN clima_base_id TO clima_actual_id;
