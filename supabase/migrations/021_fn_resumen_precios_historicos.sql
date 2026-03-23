-- Función RPC: resumen de precios históricos por región
-- Agrega precios_historico por nombre_odepa, retornando meses con datos,
-- promedios, rangos y último precio conocido.
CREATE OR REPLACE FUNCTION resumen_precios_historicos(p_region text)
RETURNS TABLE (
  nombre_odepa text,
  meses_con_datos int,
  precio_kg_promedio numeric,
  precio_kg_min numeric,
  precio_kg_max numeric,
  ultimo_precio_kg numeric,
  fecha_mas_reciente date
) AS $$
  SELECT
    ph.nombre_odepa,
    COUNT(DISTINCT to_char(ph.fecha_odepa, 'YYYY-MM'))::int AS meses_con_datos,
    ROUND(AVG(ph.precio_kg_clp))::numeric AS precio_kg_promedio,
    MIN(ph.precio_kg_clp)::numeric AS precio_kg_min,
    MAX(ph.precio_kg_clp)::numeric AS precio_kg_max,
    (ARRAY_AGG(ph.precio_kg_clp ORDER BY ph.fecha_odepa DESC))[1]::numeric AS ultimo_precio_kg,
    MAX(ph.fecha_odepa) AS fecha_mas_reciente
  FROM precios_historico ph
  WHERE ph.region = p_region
    AND ph.precio_kg_clp IS NOT NULL
  GROUP BY ph.nombre_odepa
  ORDER BY ph.nombre_odepa;
$$ LANGUAGE sql STABLE;
