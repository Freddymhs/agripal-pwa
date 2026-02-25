import type { Terreno } from '@/types'
import type { ValidationResult } from './types'

export type { ValidationResult }

export function validarTerreno(
  data: Pick<Terreno, 'nombre' | 'ancho_m' | 'alto_m'>
): ValidationResult {
  if (!data.nombre || data.nombre.trim().length === 0) {
    return { valida: false, error: 'El nombre del terreno es obligatorio' }
  }

  if (typeof data.ancho_m !== 'number' || !Number.isFinite(data.ancho_m) || data.ancho_m <= 0) {
    return { valida: false, error: 'El ancho debe ser un número mayor a 0' }
  }

  if (typeof data.alto_m !== 'number' || !Number.isFinite(data.alto_m) || data.alto_m <= 0) {
    return { valida: false, error: 'El alto debe ser un número mayor a 0' }
  }

  return { valida: true }
}
