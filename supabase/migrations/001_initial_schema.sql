-- ============================================================
-- AgriPlan PWA — Schema inicial (FASE 13)
-- Solo datos del usuario. Datos estáticos de referencia
-- viven en data/static/ y nunca se sincronizan.
-- ============================================================

-- Función para updated_at automático
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PROYECTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS proyectos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre         TEXT NOT NULL,
  descripcion    TEXT,
  datos          JSONB NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_proyectos_updated_at
  BEFORE UPDATE ON proyectos
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_owns_proyecto" ON proyectos
  FOR ALL USING (usuario_id = auth.uid());

-- ============================================================
-- TERRENOS
-- ============================================================
CREATE TABLE IF NOT EXISTS terrenos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id    UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  nombre         TEXT NOT NULL,
  datos          JSONB NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_terrenos_updated_at
  BEFORE UPDATE ON terrenos
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE terrenos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_owns_terreno" ON terrenos
  FOR ALL USING (
    proyecto_id IN (SELECT id FROM proyectos WHERE usuario_id = auth.uid())
  );

-- ============================================================
-- ZONAS
-- ============================================================
CREATE TABLE IF NOT EXISTS zonas (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  terreno_id     UUID NOT NULL REFERENCES terrenos(id) ON DELETE CASCADE,
  nombre         TEXT NOT NULL,
  tipo           TEXT NOT NULL,
  datos          JSONB NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_zonas_updated_at
  BEFORE UPDATE ON zonas
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE zonas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_owns_zona" ON zonas
  FOR ALL USING (
    terreno_id IN (
      SELECT t.id FROM terrenos t
      JOIN proyectos p ON p.id = t.proyecto_id
      WHERE p.usuario_id = auth.uid()
    )
  );

-- ============================================================
-- PLANTAS
-- ============================================================
CREATE TABLE IF NOT EXISTS plantas (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zona_id        UUID NOT NULL REFERENCES zonas(id) ON DELETE CASCADE,
  tipo_cultivo_id TEXT NOT NULL,
  estado         TEXT NOT NULL,
  datos          JSONB NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_plantas_updated_at
  BEFORE UPDATE ON plantas
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE plantas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_owns_planta" ON plantas
  FOR ALL USING (
    zona_id IN (
      SELECT z.id FROM zonas z
      JOIN terrenos t ON t.id = z.terreno_id
      JOIN proyectos p ON p.id = t.proyecto_id
      WHERE p.usuario_id = auth.uid()
    )
  );

-- ============================================================
-- ENTRADAS_AGUA
-- ============================================================
CREATE TABLE IF NOT EXISTS entradas_agua (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  terreno_id     UUID NOT NULL REFERENCES terrenos(id) ON DELETE CASCADE,
  fecha          DATE NOT NULL,
  datos          JSONB NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_entradas_agua_updated_at
  BEFORE UPDATE ON entradas_agua
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE entradas_agua ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_owns_entrada_agua" ON entradas_agua
  FOR ALL USING (
    terreno_id IN (
      SELECT t.id FROM terrenos t
      JOIN proyectos p ON p.id = t.proyecto_id
      WHERE p.usuario_id = auth.uid()
    )
  );

-- ============================================================
-- COSECHAS
-- ============================================================
CREATE TABLE IF NOT EXISTS cosechas (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zona_id        UUID NOT NULL REFERENCES zonas(id) ON DELETE CASCADE,
  tipo_cultivo_id TEXT NOT NULL,
  fecha          DATE NOT NULL,
  datos          JSONB NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_cosechas_updated_at
  BEFORE UPDATE ON cosechas
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE cosechas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_owns_cosecha" ON cosechas
  FOR ALL USING (
    zona_id IN (
      SELECT z.id FROM zonas z
      JOIN terrenos t ON t.id = z.terreno_id
      JOIN proyectos p ON p.id = t.proyecto_id
      WHERE p.usuario_id = auth.uid()
    )
  );

-- ============================================================
-- ALERTAS
-- ============================================================
CREATE TABLE IF NOT EXISTS alertas (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  terreno_id     UUID NOT NULL REFERENCES terrenos(id) ON DELETE CASCADE,
  tipo           TEXT NOT NULL,
  estado         TEXT NOT NULL,
  severidad      TEXT NOT NULL,
  datos          JSONB NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_alertas_updated_at
  BEFORE UPDATE ON alertas
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE alertas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_owns_alerta" ON alertas
  FOR ALL USING (
    terreno_id IN (
      SELECT t.id FROM terrenos t
      JOIN proyectos p ON p.id = t.proyecto_id
      WHERE p.usuario_id = auth.uid()
    )
  );

-- ============================================================
-- CATALOGO_CULTIVOS (personalizaciones por proyecto)
-- ============================================================
CREATE TABLE IF NOT EXISTS catalogo_cultivos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id    UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  nombre         TEXT NOT NULL,
  tier           TEXT NOT NULL DEFAULT 'custom',
  datos          JSONB NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_catalogo_cultivos_updated_at
  BEFORE UPDATE ON catalogo_cultivos
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE catalogo_cultivos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_owns_catalogo" ON catalogo_cultivos
  FOR ALL USING (
    proyecto_id IN (SELECT id FROM proyectos WHERE usuario_id = auth.uid())
  );

-- ============================================================
-- INSUMOS_USUARIO
-- ============================================================
CREATE TABLE IF NOT EXISTS insumos_usuario (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  terreno_id     UUID NOT NULL REFERENCES terrenos(id) ON DELETE CASCADE,
  nombre         TEXT NOT NULL,
  tipo           TEXT NOT NULL,
  datos          JSONB NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_insumos_usuario_updated_at
  BEFORE UPDATE ON insumos_usuario
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE insumos_usuario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_owns_insumo" ON insumos_usuario
  FOR ALL USING (
    terreno_id IN (
      SELECT t.id FROM terrenos t
      JOIN proyectos p ON p.id = t.proyecto_id
      WHERE p.usuario_id = auth.uid()
    )
  );

-- ============================================================
-- Índices para consultas frecuentes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_proyectos_usuario ON proyectos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_terrenos_proyecto ON terrenos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_zonas_terreno ON zonas(terreno_id);
CREATE INDEX IF NOT EXISTS idx_plantas_zona ON plantas(zona_id);
CREATE INDEX IF NOT EXISTS idx_entradas_agua_terreno ON entradas_agua(terreno_id);
CREATE INDEX IF NOT EXISTS idx_cosechas_zona ON cosechas(zona_id);
CREATE INDEX IF NOT EXISTS idx_alertas_terreno ON alertas(terreno_id);
CREATE INDEX IF NOT EXISTS idx_catalogo_proyecto ON catalogo_cultivos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_insumos_terreno ON insumos_usuario(terreno_id);

-- Índices de updated_at para sync incremental
CREATE INDEX IF NOT EXISTS idx_proyectos_updated ON proyectos(updated_at);
CREATE INDEX IF NOT EXISTS idx_terrenos_updated ON terrenos(updated_at);
CREATE INDEX IF NOT EXISTS idx_zonas_updated ON zonas(updated_at);
CREATE INDEX IF NOT EXISTS idx_plantas_updated ON plantas(updated_at);
CREATE INDEX IF NOT EXISTS idx_entradas_agua_updated ON entradas_agua(updated_at);
CREATE INDEX IF NOT EXISTS idx_cosechas_updated ON cosechas(updated_at);
CREATE INDEX IF NOT EXISTS idx_alertas_updated ON alertas(updated_at);
CREATE INDEX IF NOT EXISTS idx_catalogo_updated ON catalogo_cultivos(updated_at);
CREATE INDEX IF NOT EXISTS idx_insumos_updated ON insumos_usuario(updated_at);
