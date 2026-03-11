export const BILLING = {
  PRECIO_CLP: 9990,
  MONEDA: "CLP",
  TRIAL_DIAS: 180,
  GRACIA_DIAS: 3,
  PLAN_NOMBRE: "Plan Mensual",
  RENEWAL_MONTHS: 1,
} as const;

export type EstadoSuscripcion =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "inactive";

export type EstadoPago =
  | "pending"
  | "approved"
  | "authorized"
  | "in_process"
  | "in_mediation"
  | "rejected"
  | "cancelled"
  | "refunded"
  | "charged_back";

/** Mapeo MercadoPago status string → enum estado_pago en DB */
export const MP_ESTADO_MAP: Record<string, EstadoPago> = {
  pending: "pending",
  approved: "approved",
  authorized: "authorized",
  in_process: "in_process",
  in_mediation: "in_mediation",
  rejected: "rejected",
  cancelled: "cancelled",
  refunded: "refunded",
  charged_back: "charged_back",
};
