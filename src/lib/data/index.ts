export {
  CLIMA_ARICA,
  getTemporadaActual,
  ETO_ARICA,
  getEtoMesActual,
  hayCamanchaca,
  getFactorClimatico,
  type DatosClimaticos,
  type DatosETo,
  type EtoMensual,
  type DatosCamanchaca,
} from "./clima-arica";
export { CULTIVOS_ARICA, obtenerCultivo } from "./cultivos-arica";
export {
  UMBRALES_AGUA,
  RIOS_ARICA,
  PROVEEDORES_HIDROGEL_CHILE,
  TECNICAS_AHORRO_INFO,
} from "./umbrales-agua";
export {
  UMBRALES_SUELO,
  evaluarSuelo,
  type EvaluacionSuelo,
} from "./umbrales-suelo";
export { FUENTES_AGUA_ARICA, obtenerFuente } from "./fuentes-agua";
export {
  ENMIENDAS_SUELO,
  obtenerEnmienda,
  sugerirEnmiendas,
  type Enmienda,
} from "./enmiendas-suelo";
export {
  VARIEDADES_ARICA,
  obtenerVariedades,
  type VariedadCultivo,
} from "./variedades";
export { MERCADO_ARICA, obtenerMercado, type DatosMercado } from "./mercado";
export { TECNICAS_MEJORA, type TecnicaMejora } from "./tecnicas-mejora";
export { SUELO_DEFAULT_AZAPA } from "./suelo-arica";
