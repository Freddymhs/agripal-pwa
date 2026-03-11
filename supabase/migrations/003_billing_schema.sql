-- ============================================================
-- AgriPlan PWA — Billing schema (FASE 14)
-- Planes, suscripciones y pagos con MercadoPago.
-- ============================================================

-- ============================================================
-- PLANES
-- ============================================================
CREATE TABLE IF NOT EXISTS planes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT NOT NULL,
  precio      INTEGER NOT NULL,
  moneda      TEXT NOT NULL DEFAULT 'CLP',
  intervalo   TEXT NOT NULL DEFAULT 'monthly',
  descripcion TEXT,
  activo      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO planes (nombre, precio, moneda, intervalo, descripcion) VALUES
('Plan Mensual', 9990, 'CLP', 'monthly', 'Acceso completo a AgriPlan');

-- ============================================================
-- SUSCRIPCIONES
-- ============================================================
CREATE TYPE estado_suscripcion AS ENUM (
  'trialing',
  'active',
  'past_due',
  'canceled',
  'inactive'
);

CREATE TABLE IF NOT EXISTS suscripciones (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id               UUID NOT NULL REFERENCES planes(id),
  estado                estado_suscripcion NOT NULL DEFAULT 'inactive',

  current_period_start  TIMESTAMPTZ,
  current_period_end    TIMESTAMPTZ,

  trial_start           TIMESTAMPTZ,
  trial_end             TIMESTAMPTZ,

  mp_subscription_id    TEXT UNIQUE,
  mp_preapproval_id     TEXT,

  cancel_at_period_end  BOOLEAN DEFAULT false,
  canceled_at           TIMESTAMPTZ,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_suscripciones_usuario ON suscripciones(usuario_id);
CREATE INDEX idx_suscripciones_estado ON suscripciones(estado);

CREATE TRIGGER set_suscripciones_updated_at
  BEFORE UPDATE ON suscripciones
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- PAGOS
-- ============================================================
CREATE TYPE estado_pago AS ENUM (
  'pending',
  'approved',
  'authorized',
  'in_process',
  'in_mediation',
  'rejected',
  'cancelled',
  'refunded',
  'charged_back'
);

CREATE TABLE IF NOT EXISTS pagos (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suscripcion_id        UUID REFERENCES suscripciones(id),

  monto                 INTEGER NOT NULL,
  moneda                TEXT NOT NULL DEFAULT 'CLP',

  estado                estado_pago NOT NULL DEFAULT 'pending',

  mp_payment_id         TEXT UNIQUE,
  mp_preference_id      TEXT,
  mp_merchant_order_id  TEXT,

  descripcion           TEXT,
  metadata              JSONB,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pagos_usuario ON pagos(usuario_id);
CREATE INDEX idx_pagos_suscripcion ON pagos(suscripcion_id);
CREATE INDEX idx_pagos_estado ON pagos(estado);
CREATE INDEX idx_pagos_mp_payment ON pagos(mp_payment_id);

CREATE TRIGGER set_pagos_updated_at
  BEFORE UPDATE ON pagos
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE planes ENABLE ROW LEVEL SECURITY;
ALTER TABLE suscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;

-- Planes: lectura pública (cualquier usuario autenticado puede ver los planes)
CREATE POLICY "planes_select_authenticated" ON planes
  FOR SELECT TO authenticated
  USING (true);

-- Suscripciones: usuario solo ve las suyas
CREATE POLICY "user_owns_suscripcion" ON suscripciones
  FOR SELECT
  USING (usuario_id = auth.uid());

-- Pagos: usuario solo ve los suyos
CREATE POLICY "user_owns_pago" ON pagos
  FOR SELECT
  USING (usuario_id = auth.uid());

-- ============================================================
-- FUNCION: has_active_subscription
-- Retorna true si el usuario tiene suscripcion active o trialing
-- vigente (no expirada). Usada por RLS en tablas de datos.
-- ============================================================
CREATE OR REPLACE FUNCTION has_active_subscription(uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM suscripciones
    WHERE usuario_id = uid
      AND estado IN ('active', 'trialing', 'past_due')
      AND (
        (estado = 'trialing' AND trial_end > NOW())
        OR (estado IN ('active', 'past_due') AND current_period_end > NOW())
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- TRIGGER: auto-crear trial al registrarse
-- Cuando un usuario se registra en auth.users, se crea
-- automaticamente una suscripcion trialing de 180 dias.
-- ============================================================
CREATE OR REPLACE FUNCTION create_trial_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  default_plan_id UUID;
BEGIN
  SELECT id INTO default_plan_id FROM planes WHERE activo = true LIMIT 1;

  IF default_plan_id IS NOT NULL THEN
    INSERT INTO suscripciones (
      usuario_id, plan_id, estado,
      trial_start, trial_end,
      current_period_start, current_period_end
    ) VALUES (
      NEW.id, default_plan_id, 'trialing',
      NOW(), NOW() + INTERVAL '180 days',
      NOW(), NOW() + INTERVAL '180 days'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_trial_on_signup();

-- ============================================================
-- RLS WRITE-GUARD: bloquear escritura sin suscripcion activa
-- Solo afecta INSERT/UPDATE — SELECT sigue libre para que el
-- usuario siempre pueda ver sus datos.
-- ============================================================

-- Proyectos
CREATE POLICY "billing_guard_proyectos_insert" ON proyectos
  FOR INSERT WITH CHECK (has_active_subscription(auth.uid()));
CREATE POLICY "billing_guard_proyectos_update" ON proyectos
  FOR UPDATE USING (has_active_subscription(auth.uid()));

-- Terrenos
CREATE POLICY "billing_guard_terrenos_insert" ON terrenos
  FOR INSERT WITH CHECK (has_active_subscription(auth.uid()));
CREATE POLICY "billing_guard_terrenos_update" ON terrenos
  FOR UPDATE USING (has_active_subscription(auth.uid()));

-- Zonas
CREATE POLICY "billing_guard_zonas_insert" ON zonas
  FOR INSERT WITH CHECK (has_active_subscription(auth.uid()));
CREATE POLICY "billing_guard_zonas_update" ON zonas
  FOR UPDATE USING (has_active_subscription(auth.uid()));

-- Plantas
CREATE POLICY "billing_guard_plantas_insert" ON plantas
  FOR INSERT WITH CHECK (has_active_subscription(auth.uid()));
CREATE POLICY "billing_guard_plantas_update" ON plantas
  FOR UPDATE USING (has_active_subscription(auth.uid()));

-- Entradas agua
CREATE POLICY "billing_guard_entradas_agua_insert" ON entradas_agua
  FOR INSERT WITH CHECK (has_active_subscription(auth.uid()));
CREATE POLICY "billing_guard_entradas_agua_update" ON entradas_agua
  FOR UPDATE USING (has_active_subscription(auth.uid()));

-- Cosechas
CREATE POLICY "billing_guard_cosechas_insert" ON cosechas
  FOR INSERT WITH CHECK (has_active_subscription(auth.uid()));
CREATE POLICY "billing_guard_cosechas_update" ON cosechas
  FOR UPDATE USING (has_active_subscription(auth.uid()));

-- Catalogo cultivos
CREATE POLICY "billing_guard_catalogo_insert" ON catalogo_cultivos
  FOR INSERT WITH CHECK (has_active_subscription(auth.uid()));
CREATE POLICY "billing_guard_catalogo_update" ON catalogo_cultivos
  FOR UPDATE USING (has_active_subscription(auth.uid()));

-- Insumos usuario
CREATE POLICY "billing_guard_insumos_insert" ON insumos_usuario
  FOR INSERT WITH CHECK (has_active_subscription(auth.uid()));
CREATE POLICY "billing_guard_insumos_update" ON insumos_usuario
  FOR UPDATE USING (has_active_subscription(auth.uid()));
