/**
 * Centralized route definitions for the AgriPlan PWA application.
 * Use these constants instead of hardcoding route strings throughout the codebase.
 */

export const ROUTES = {
  // Public / Marketing
  LANDING: "/",
  NORTE_CHILE: "/norte-chile",
  TARAPACA: "/tarapaca",
  ARICA: "/arica",
  COMPARATIVA: "/comparativa",

  // Authentication
  AUTH_LOGIN: "/auth/login",
  AUTH_REGISTRO: "/auth/registro",
  AUTH_RECUPERAR: "/auth/recuperar",
  AUTH_NUEVA_PASSWORD: "/auth/nueva-password",

  // Primary routes
  HOME: "/app",
  TERRENOS: "/terrenos",
  TERRENOS_SUELO: "/terrenos/suelo",

  // Agua module
  AGUA: "/agua",
  AGUA_PLANIFICADOR: "/agua/planificador",
  AGUA_CONFIGURACION: "/agua/configuracion",

  // Economía module
  ECONOMIA: "/economia",
  ECONOMIA_AVANZADO: "/economia/avanzado",
  ECONOMIA_ESCENARIOS: "/economia/escenarios",

  // Calendario Gantt
  GANTT: "/gantt",

  // Datos de referencia
  DATOS_CATALOGO: "/datos/catalogo",
  DATOS_CLIMA: "/datos/clima",
  DATOS_PLAGAS: "/datos/plagas",
  DATOS_INSUMOS: "/datos/insumos",

  // Billing
  BILLING_SUBSCRIBE: "/billing/subscribe",
  BILLING_MANAGE: "/billing/manage",
  BILLING_SUCCESS: "/billing/success",
  BILLING_FAILURE: "/billing/failure",

  // Cosechas
  COSECHAS: "/cosechas",

  // Reportes
  REPORTES: "/reportes",

  // Operaciones
  ALERTAS: "/alertas",
  GUIA: "/guia",
  CONFIGURACION: "/configuracion",
} as const;

export type RouteKey = keyof typeof ROUTES;
