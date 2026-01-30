import variedadesData from '../../../data/static/variedades/arica.json'

export interface VariedadCultivo {
  id: string
  cultivo_id: string
  nombre: string
  origen: string
  ventajas: string[]
  desventajas: string[]
  rendimiento_relativo: number
  precio_planta_clp: number
}

export const VARIEDADES_ARICA: VariedadCultivo[] = variedadesData as VariedadCultivo[]

export function obtenerVariedades(cultivoId: string): VariedadCultivo[] {
  return VARIEDADES_ARICA.filter(v => v.cultivo_id === cultivoId)
}
