-- ============================================================
-- AgriPlan — Tabla de plaguicidas histórico
--
-- Persiste los registros de plaguicidas del SAG en Supabase
-- en lugar de solo caché Redis. Permite análisis histórico
-- y consultas desde el Portal e IA.
-- ============================================================

CREATE TABLE IF NOT EXISTS plaguicidas_historico (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre                  TEXT NOT NULL,
  sustancias_activas      TEXT NOT NULL,  -- coma separada o JSON array
  aptitud                 TEXT NOT NULL,  -- qué plaga/uso (herbicida, insecticida, fungicida)
  titular_autorizacion    TEXT,
  clasificacion_toxicologica TEXT,  -- Categoría I, II, III, IV
  clase_ambiental         TEXT,  -- A, B, C, D, E
  mercado_rojo            BOOLEAN DEFAULT false,  -- restringido
  datos                   JSONB DEFAULT '{}',  -- campos extra del SAG
  synced_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fuente                  TEXT NOT NULL DEFAULT 'sag',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE plaguicidas_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plaguicidas_historico_read" ON plaguicidas_historico
  FOR SELECT TO authenticated USING (true);

-- Índices para búsqueda
CREATE INDEX IF NOT EXISTS idx_plaguicidas_nombre
  ON plaguicidas_historico(nombre);

CREATE INDEX IF NOT EXISTS idx_plaguicidas_aptitud
  ON plaguicidas_historico(aptitud);

CREATE INDEX IF NOT EXISTS idx_plaguicidas_sustancia
  ON plaguicidas_historico USING GIN(string_to_array(sustancias_activas, ','));

CREATE INDEX IF NOT EXISTS idx_plaguicidas_synced
  ON plaguicidas_historico(synced_at DESC);

CREATE TRIGGER set_plaguicidas_historico_updated_at
  BEFORE UPDATE ON plaguicidas_historico
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
