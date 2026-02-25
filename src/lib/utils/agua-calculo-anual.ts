import type { Zona, EntradaAgua, Planta, CatalogoCultivo } from '@/types'
import { calcularConsumoTerreno } from './agua'
import { SEMANAS_POR_AÑO } from '@/lib/constants/conversiones'

export interface CalculoAguaAnual {
  aguaAnualM3: number
  metodoCalculo: 'historial' | 'consumo_cultivos' | 'estimacion_default'
  detalles: string
  confianza: 'alta' | 'media' | 'baja'
}

export function calcularAguaAnualAutomatica(
  estanques: Zona[],
  entradasAgua: EntradaAgua[],
  zonas: Zona[],
  plantas: Planta[],
  catalogoCultivos: CatalogoCultivo[]
): CalculoAguaAnual {
  if (entradasAgua.length >= 2) {
    return calcularPorHistorial(estanques, entradasAgua)
  }

  const consumoSemanal = calcularConsumoTerreno(zonas, plantas, catalogoCultivos)
  if (consumoSemanal > 0) {
    return calcularPorConsumoCultivos(consumoSemanal)
  }

  return calcularEstimacionDefault(estanques)
}

function calcularPorHistorial(
  estanques: Zona[],
  entradasAgua: EntradaAgua[]
): CalculoAguaAnual {
  const entradasOrdenadas = [...entradasAgua].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  )

  let sumaDiasEntreEntradas = 0
  let cantidadIntervalos = 0

  for (let i = 1; i < entradasOrdenadas.length; i++) {
    const fechaAnterior = new Date(entradasOrdenadas[i - 1].fecha)
    const fechaActual = new Date(entradasOrdenadas[i].fecha)
    const diasEntre = (fechaActual.getTime() - fechaAnterior.getTime()) / (1000 * 60 * 60 * 24)

    if (diasEntre > 0 && diasEntre < 365) {
      sumaDiasEntreEntradas += diasEntre
      cantidadIntervalos++
    }
  }

  if (cantidadIntervalos === 0) {
    return calcularEstimacionDefault(estanques)
  }

  const promedioEntreLlenadas = sumaDiasEntreEntradas / cantidadIntervalos
  const capacidadTotal = estanques.reduce((sum, e) => sum + (e.estanque_config?.capacidad_m3 || 0), 0)
  const llenadaPorAño = 365 / promedioEntreLlenadas
  const aguaAnual = capacidadTotal * llenadaPorAño

  return {
    aguaAnualM3: Math.round(aguaAnual),
    metodoCalculo: 'historial',
    detalles: `Basado en ${entradasAgua.length} entradas. Promedio cada ${Math.round(promedioEntreLlenadas)} días → ${Math.round(llenadaPorAño)} llenadas/año`,
    confianza: entradasAgua.length >= 4 ? 'alta' : 'media',
  }
}

function calcularPorConsumoCultivos(consumoSemanal: number): CalculoAguaAnual {
  const aguaAnual = consumoSemanal * SEMANAS_POR_AÑO

  return {
    aguaAnualM3: Math.round(aguaAnual),
    metodoCalculo: 'consumo_cultivos',
    detalles: `Basado en consumo de cultivos: ${consumoSemanal.toFixed(1)} m³/semana × 52 semanas`,
    confianza: 'baja',
  }
}

function calcularEstimacionDefault(estanques: Zona[]): CalculoAguaAnual {
  const capacidadTotal = estanques.reduce((sum, e) => sum + (e.estanque_config?.capacidad_m3 || 0), 0)
  const aguaAnual = capacidadTotal * 26

  return {
    aguaAnualM3: Math.round(aguaAnual),
    metodoCalculo: 'estimacion_default',
    detalles: `Estimación conservadora: ${capacidadTotal.toFixed(1)} m³ × 26 llenadas/año (cada 2 semanas)`,
    confianza: 'baja',
  }
}
