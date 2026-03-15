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

export const ESTADO_SUSCRIPCION = {
  TRIALING: "trialing",
  ACTIVE: "active",
  PAST_DUE: "past_due",
  CANCELED: "canceled",
  INACTIVE: "inactive",
} as const satisfies Record<string, EstadoSuscripcion>;

/** Estados de suscripcion que permiten acceso a la app */
export const ESTADOS_SUSCRIPCION_PERMITIDOS: ReadonlySet<string> = new Set([
  ESTADO_SUSCRIPCION.ACTIVE,
  ESTADO_SUSCRIPCION.TRIALING,
  ESTADO_SUSCRIPCION.PAST_DUE,
]);

/** Estados de suscripcion considerados "activos" (no requieren pago) */
export const ESTADOS_SUSCRIPCION_ACTIVOS: readonly EstadoSuscripcion[] = [
  ESTADO_SUSCRIPCION.ACTIVE,
  ESTADO_SUSCRIPCION.TRIALING,
];

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

export const ESTADO_PAGO = {
  PENDING: "pending",
  APPROVED: "approved",
  AUTHORIZED: "authorized",
  IN_PROCESS: "in_process",
  IN_MEDIATION: "in_mediation",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
  CHARGED_BACK: "charged_back",
} as const satisfies Record<string, EstadoPago>;

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
