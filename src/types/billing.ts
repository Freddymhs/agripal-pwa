import type { UUID, Timestamp, PesosCLP } from "@/types";
import type { EstadoSuscripcion, EstadoPago } from "@/lib/constants/billing";

export interface Plan {
  id: UUID;
  nombre: string;
  precio: PesosCLP;
  moneda: string;
  intervalo: string;
  descripcion: string | null;
  activo: boolean;
  created_at: Timestamp;
}

export interface Suscripcion {
  id: UUID;
  usuario_id: UUID;
  plan_id: UUID;
  estado: EstadoSuscripcion;
  current_period_start: Timestamp | null;
  current_period_end: Timestamp | null;
  trial_start: Timestamp | null;
  trial_end: Timestamp | null;
  mp_subscription_id: string | null;
  mp_preapproval_id: string | null;
  cancel_at_period_end: boolean;
  canceled_at: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Pago {
  id: UUID;
  usuario_id: UUID;
  suscripcion_id: UUID | null;
  monto: PesosCLP;
  moneda: string;
  estado: EstadoPago;
  mp_payment_id: string | null;
  mp_preference_id: string | null;
  mp_merchant_order_id: string | null;
  descripcion: string | null;
  metadata: Record<string, unknown> | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface CheckoutResponse {
  preferenceId: string;
  initPoint: string;
  pagoId: string;
}
