-- ============================================================
-- Migracion 019: Backfill tipo y Kc para proyectos existentes
--
-- Corrige 2 gaps de migraciones anteriores:
-- 1. catalogo_cultivos_config.tipo = 'fruta' para 7 verduras
--    (015 solo clasifico 3 de 10 verduras)
-- 2. catalogo_cultivos con Kc NULL para Granada, Algarrobo,
--    Camote/Batata, Romero (010 no tenia LIKE patterns)
--
-- Para proyectos NUEVOS esto no aplica: el seed + trigger
-- ya copian datos correctos desde catalogo_base.
-- ============================================================

-- 1. Asegurar catalogo_base.tipo correcto (idempotente, por si seed no se re-ejecuto)
UPDATE catalogo_base SET tipo = 'verdura' WHERE id IN (
  'verdura-oregano',
  'verdura-ajo',
  'verdura-cebolla',
  'verdura-zapallo',
  'verdura-camote',
  'verdura-romero',
  'verdura-quinoa',
  'huerto-tomate-cherry',
  'huerto-aji',
  'huerto-choclo'
);

-- 2. Propagar Kc desde catalogo_base a catalogo_cultivos existentes con NULL
UPDATE catalogo_cultivos cc
SET
  kc_plantula = cb.kc_plantula,
  kc_joven    = cb.kc_joven,
  kc_adulta   = cb.kc_adulta,
  kc_madura   = cb.kc_madura
FROM catalogo_base cb
WHERE cc.cultivo_base_id = cb.id
  AND (cc.kc_plantula IS NULL OR cc.kc_joven IS NULL OR cc.kc_adulta IS NULL OR cc.kc_madura IS NULL)
  AND cb.kc_plantula IS NOT NULL;

-- 3. Propagar tipo correcto a catalogo_cultivos_config
UPDATE catalogo_cultivos_config ccc
SET tipo = cb.tipo
FROM catalogo_cultivos cc
JOIN catalogo_base cb ON cc.cultivo_base_id = cb.id
WHERE ccc.cultivo_id = cc.id
  AND ccc.tipo <> cb.tipo;
