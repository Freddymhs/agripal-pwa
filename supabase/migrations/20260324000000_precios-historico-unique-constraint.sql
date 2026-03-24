-- Eliminar duplicados y agregar constraint único en precios_historico.
-- Evita que el cron (cada 6h) inserte el mismo registro de ODEPA múltiples veces al día.
-- La clave única es: nombre_odepa + region + mercado + fecha_odepa + precio_actual_clp
-- porque ODEPA reporta múltiples precios por producto/mercado/día (distintos vendedores).

DELETE FROM precios_historico a
USING precios_historico b
WHERE a.ctid < b.ctid
  AND a.nombre_odepa = b.nombre_odepa
  AND a.region = b.region
  AND COALESCE(a.mercado, '') = COALESCE(b.mercado, '')
  AND a.fecha_odepa = b.fecha_odepa
  AND a.precio_actual_clp = b.precio_actual_clp;

ALTER TABLE precios_historico
  ADD CONSTRAINT uq_precios_historico_entry
  UNIQUE (nombre_odepa, region, mercado, fecha_odepa, precio_actual_clp);
