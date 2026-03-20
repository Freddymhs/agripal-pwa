-- ============================================================
-- Migración 015: Tablas de configuración / trazabilidad
--
-- 1. precios_mayoristas_config: quién y cómo se obtuvo el precio
-- 2. catalogo_cultivos_config: clasificación y proveniencia del cultivo
-- ============================================================

-- ─── 1. precios_mayoristas_config ────────────────────────────

CREATE TABLE IF NOT EXISTS precios_mayoristas_config (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  precio_id  TEXT NOT NULL UNIQUE REFERENCES precios_mayoristas(id) ON DELETE CASCADE,
  updated_by TEXT NOT NULL DEFAULT 'seed',
  origen     TEXT NOT NULL DEFAULT 'seed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE precios_mayoristas_config IS
  'Trazabilidad de precios: quién estableció el dato y su proveniencia';
COMMENT ON COLUMN precios_mayoristas_config.updated_by IS
  'Quién escribió el precio: api (cron ODEPA), skill (calibración IA), admin (manual)';
COMMENT ON COLUMN precios_mayoristas_config.origen IS
  'Proveniencia del registro: seed (dato inicial), usuario (agregado manualmente)';

ALTER TABLE precios_mayoristas_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "precios_mayoristas_config_read" ON precios_mayoristas_config
  FOR SELECT TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_precios_config_precio
  ON precios_mayoristas_config(precio_id);

-- Poblar desde precios existentes
INSERT INTO precios_mayoristas_config (precio_id, updated_by, origen)
SELECT id,
  CASE fuente
    WHEN 'odepa'         THEN 'api'
    WHEN 'estimado'      THEN 'skill'
    WHEN 'investigacion' THEN 'admin'
    ELSE 'seed'
  END,
  'seed'
FROM precios_mayoristas
ON CONFLICT (precio_id) DO NOTHING;

-- ─── 2. catalogo_cultivos_config ─────────────────────────────

CREATE TABLE IF NOT EXISTS catalogo_cultivos_config (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cultivo_id UUID NOT NULL UNIQUE REFERENCES catalogo_cultivos(id) ON DELETE CASCADE,
  tipo       TEXT NOT NULL DEFAULT 'fruta',
  origen     TEXT NOT NULL DEFAULT 'seed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE catalogo_cultivos_config IS
  'Clasificación y proveniencia de cultivos en el catálogo del usuario';
COMMENT ON COLUMN catalogo_cultivos_config.tipo IS
  'Clasificación: fruta, verdura, aromatica, grano';
COMMENT ON COLUMN catalogo_cultivos_config.origen IS
  'Proveniencia: seed (recomendado por sistema), usuario (creado por el usuario)';

ALTER TABLE catalogo_cultivos_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_owns_catalogo_config" ON catalogo_cultivos_config
  FOR ALL USING (
    cultivo_id IN (
      SELECT cc.id FROM catalogo_cultivos cc
      JOIN proyectos p ON cc.proyecto_id = p.id
      WHERE p.usuario_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_catalogo_config_cultivo
  ON catalogo_cultivos_config(cultivo_id);

-- ─── 3. catalogo_base necesita tipo para que el trigger sepa qué copiar ─

ALTER TABLE catalogo_base
  ADD COLUMN IF NOT EXISTS tipo   TEXT NOT NULL DEFAULT 'fruta',
  ADD COLUMN IF NOT EXISTS origen TEXT NOT NULL DEFAULT 'seed';

-- Clasificar extras como verdura
UPDATE catalogo_base SET tipo = 'verdura' WHERE id IN (
  'huerto-tomate-cherry',
  'huerto-aji',
  'huerto-choclo'
);

-- ─── 4. Actualizar trigger: copiar cultivos + crear config ───

CREATE OR REPLACE FUNCTION copiar_catalogo_base_a_proyecto()
RETURNS TRIGGER AS $$
BEGIN
  -- Copiar cultivos
  INSERT INTO catalogo_cultivos (proyecto_id, nombre, tier, kc_plantula, kc_joven, kc_adulta, kc_madura, datos)
  SELECT NEW.id, nombre, tier, kc_plantula, kc_joven, kc_adulta, kc_madura, datos
  FROM catalogo_base;

  -- Crear config para cada cultivo copiado
  INSERT INTO catalogo_cultivos_config (cultivo_id, tipo, origen)
  SELECT cc.id, cb.tipo, cb.origen
  FROM catalogo_cultivos cc
  JOIN catalogo_base cb ON cc.nombre = cb.nombre AND cc.proyecto_id = NEW.id;

  -- Copiar enmiendas, técnicas, fuentes de agua
  INSERT INTO enmiendas_proyecto (proyecto_id, nombre, tipo, datos)
  SELECT NEW.id, nombre, tipo, datos FROM enmiendas_base;

  INSERT INTO tecnicas_proyecto (proyecto_id, nombre, categoria, datos)
  SELECT NEW.id, nombre, categoria, datos FROM tecnicas_base;

  INSERT INTO fuentes_agua_proyecto (proyecto_id, nombre, tipo, datos)
  SELECT NEW.id, nombre, tipo, datos FROM fuentes_agua_base;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 5. Poblar config para catalogo_cultivos ya existentes ───

INSERT INTO catalogo_cultivos_config (cultivo_id, tipo, origen)
SELECT cc.id, COALESCE(cb.tipo, 'fruta'), COALESCE(cb.origen, 'seed')
FROM catalogo_cultivos cc
LEFT JOIN catalogo_base cb ON cc.nombre = cb.nombre
WHERE NOT EXISTS (
  SELECT 1 FROM catalogo_cultivos_config ccc WHERE ccc.cultivo_id = cc.id
);
