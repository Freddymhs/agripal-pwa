import type { CatalogoCultivo } from '@/types'
import type { ValidationResult } from './types'

export type { ValidationResult }

export function validarCatalogoCultivo(
  data: Partial<CatalogoCultivo>
): ValidationResult {
  if (!data.nombre || data.nombre.trim().length === 0) {
    return { valida: false, error: 'El nombre del cultivo es obligatorio' }
  }

  if (typeof data.agua_m3_ha_año_min !== 'number' || data.agua_m3_ha_año_min <= 0) {
    return { valida: false, error: 'El agua mínima (m3/ha/año) debe ser mayor a 0' }
  }

  if (typeof data.agua_m3_ha_año_max !== 'number' || data.agua_m3_ha_año_max <= 0) {
    return { valida: false, error: 'El agua máxima (m3/ha/año) debe ser mayor a 0' }
  }

  if (data.agua_m3_ha_año_min > data.agua_m3_ha_año_max) {
    return { valida: false, error: 'El agua mínima no puede ser mayor que el agua máxima' }
  }

  if (typeof data.espaciado_min_m !== 'number' || data.espaciado_min_m <= 0) {
    return { valida: false, error: 'El espaciado mínimo debe ser mayor a 0' }
  }

  if (typeof data.espaciado_recomendado_m !== 'number' || data.espaciado_recomendado_m <= 0) {
    return { valida: false, error: 'El espaciado recomendado debe ser mayor a 0' }
  }

  if (data.espaciado_min_m > data.espaciado_recomendado_m) {
    return { valida: false, error: 'El espaciado mínimo no puede ser mayor que el recomendado' }
  }

  if (typeof data.ph_min !== 'number' || data.ph_min < 0 || data.ph_min > 14) {
    return { valida: false, error: 'El pH mínimo debe estar entre 0 y 14' }
  }

  if (typeof data.ph_max !== 'number' || data.ph_max < 0 || data.ph_max > 14) {
    return { valida: false, error: 'El pH máximo debe estar entre 0 y 14' }
  }

  if (data.ph_min > data.ph_max) {
    return { valida: false, error: 'El pH mínimo no puede ser mayor que el pH máximo' }
  }

  if (typeof data.salinidad_tolerancia_dS_m !== 'number' || data.salinidad_tolerancia_dS_m <= 0) {
    return { valida: false, error: 'La tolerancia a salinidad debe ser mayor a 0' }
  }

  if (typeof data.boro_tolerancia_ppm !== 'number' || data.boro_tolerancia_ppm <= 0) {
    return { valida: false, error: 'La tolerancia a boro debe ser mayor a 0' }
  }

  if (typeof data.precio_kg_min_clp !== 'number' || data.precio_kg_min_clp < 0) {
    return { valida: false, error: 'El precio mínimo por kg no puede ser negativo' }
  }

  if (typeof data.precio_kg_max_clp !== 'number' || data.precio_kg_max_clp < 0) {
    return { valida: false, error: 'El precio máximo por kg no puede ser negativo' }
  }

  if (data.precio_kg_min_clp > data.precio_kg_max_clp) {
    return { valida: false, error: 'El precio mínimo no puede ser mayor que el precio máximo' }
  }

  if (typeof data.tiempo_produccion_meses !== 'number' || data.tiempo_produccion_meses <= 0) {
    return { valida: false, error: 'El tiempo de producción debe ser mayor a 0 meses' }
  }

  if (typeof data.vida_util_años !== 'number' || data.vida_util_años <= 0) {
    return { valida: false, error: 'La vida útil debe ser mayor a 0 años' }
  }

  return { valida: true }
}
