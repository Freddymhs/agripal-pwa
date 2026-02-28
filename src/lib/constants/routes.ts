/**
 * Centralized route definitions for the AgriPlan PWA application.
 * Use these constants instead of hardcoding route strings throughout the codebase.
 */

export const ROUTES = {
  // Public
  LANDING: "/",

  // Authentication
  AUTH_LOGIN: "/auth/login",
  AUTH_REGISTRO: "/auth/registro",

  // Primary routes
  HOME: "/app",
  TERRENOS: "/terrenos",
  CATALOGO: "/catalogo",
  CLIMA: "/clima",
  SUELO: "/suelo",

  // Agua module
  AGUA: "/agua",
  AGUA_PLANIFICADOR: "/agua/planificador",
  AGUA_CONFIGURACION: "/agua/configuracion",

  // Economía module
  ECONOMIA: "/economia",
  ECONOMIA_AVANZADO: "/economia/avanzado",
  ECONOMIA_PROYECCION: "/economia/proyeccion",

  // Advanced features
  ESCENARIOS: "/escenarios",
  PLAGAS: "/plagas",
  ALERTAS: "/alertas",
  GUIA: "/guia",
} as const;

export type RouteKey = keyof typeof ROUTES;
