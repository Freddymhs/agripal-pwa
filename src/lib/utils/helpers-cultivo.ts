import type { CatalogoCultivo, Zona } from '@/types'
import { M2_POR_HECTAREA } from '@/lib/constants/conversiones'
import { TIPO_ZONA } from '@/lib/constants/entities'

export function calcularPrecioKgPromedio(cultivo: CatalogoCultivo): number {
  return (cultivo.precio_kg_min_clp + cultivo.precio_kg_max_clp) / 2
}

export function calcularAguaPromedioHaAño(cultivo: CatalogoCultivo): number {
  return (cultivo.agua_m3_ha_año_min + cultivo.agua_m3_ha_año_max) / 2
}

export function calcularDensidadPlantas(espaciadoM: number, areaM2: number): {
  espaciadoM2: number
  numPlantas: number
} {
  const espaciadoM2 = espaciadoM ** 2
  const numPlantas = espaciadoM2 > 0 ? Math.floor(areaM2 / espaciadoM2) : 0
  return { espaciadoM2, numPlantas }
}

export function calcularPlantasPorHa(espaciadoM: number): number {
  const espaciadoM2 = espaciadoM ** 2
  return espaciadoM2 > 0 ? M2_POR_HECTAREA / espaciadoM2 : 0
}

export function filtrarEstanques(zonas: Zona[]): Zona[] {
  return zonas.filter((z) => z.tipo === TIPO_ZONA.ESTANQUE && z.estanque_config)
}

export function obtenerStockAgua(
  estanques: Zona[],
  aguaTerrenoM3: number,
  aguaTotalEstanques: number,
): number {
  return estanques.length > 0 ? aguaTotalEstanques : aguaTerrenoM3
}
