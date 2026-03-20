export {
  getTemporadaActual,
  getEtoMesActual,
  hayCamanchaca,
  getFactorClimatico,
  type DatosClimaticos,
  type DatosETo,
  type EtoMensual,
  type DatosCamanchaca,
} from "./calculos-clima";
export { UMBRALES_AGUA } from "./umbrales-agua";
export {
  UMBRALES_SUELO,
  evaluarSuelo,
  type EvaluacionSuelo,
} from "./umbrales-suelo";
export { obtenerFuente } from "./fuentes-agua";
export {
  obtenerEnmienda,
  sugerirEnmiendas,
  type Enmienda,
} from "./enmiendas-suelo";
export { type VariedadCultivo } from "./tipos-variedades";
export { type TecnicaMejora } from "./tecnicas-mejora";
export { SUELO_EJEMPLO } from "./suelo-ejemplo";
