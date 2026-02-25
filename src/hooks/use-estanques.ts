'use client'

import { useMemo, useCallback } from 'react'
import { zonasDAL, transaccionesDAL } from '@/lib/dal'
import { getCurrentTimestamp } from '@/lib/utils'
import { calcularStockEstanques } from '@/lib/utils/agua'
import { emitZonaUpdated } from '@/lib/events/zona-events'
import type { Zona, UUID } from '@/types'
import { TIPO_ZONA } from '@/lib/constants/entities'

interface UseEstanques {
  estanques: Zona[]
  aguaTotalDisponible: number
  aguaTotalActual: number

  agregarAgua: (estanqueId: UUID, cantidad: number) => Promise<{ error?: string }>
  transferirAgua: (origenId: UUID, destinoId: UUID, cantidad: number) => Promise<{ error?: string }>
  obtenerEstanquePrincipal: () => Zona | null
}

export function useEstanques(
  zonas: Zona[],
  onRefetch: () => void
): UseEstanques {
  const estanques = useMemo(() => {
    return zonas.filter(z => z.tipo === TIPO_ZONA.ESTANQUE && z.estanque_config)
  }, [zonas])

  const stock = useMemo(() => calcularStockEstanques(estanques), [estanques])
  const aguaTotalDisponible = stock.capacidadTotal
  const aguaTotalActual = stock.aguaTotal

  const agregarAgua = useCallback(async (estanqueId: UUID, cantidad: number) => {
    const estanque = estanques.find(e => e.id === estanqueId)
    if (!estanque || !estanque.estanque_config) {
      return { error: 'Estanque no encontrado' }
    }

    const { capacidad_m3, nivel_actual_m3 } = estanque.estanque_config
    const espacioDisponible = capacidad_m3 - nivel_actual_m3
    const cantidadReal = Math.min(cantidad, espacioDisponible)

    if (cantidadReal <= 0) {
      return { error: 'Estanque lleno' }
    }

    const nuevoNivel = nivel_actual_m3 + cantidadReal

    await zonasDAL.update(estanqueId, {
      estanque_config: {
        ...estanque.estanque_config,
        nivel_actual_m3: nuevoNivel,
      },
      updated_at: getCurrentTimestamp(),
    })

    emitZonaUpdated(estanqueId)
    onRefetch()
    return {}
  }, [estanques, onRefetch])

  const transferirAgua = useCallback(async (origenId: UUID, destinoId: UUID, cantidad: number) => {
    const origen = estanques.find(e => e.id === origenId)
    const destino = estanques.find(e => e.id === destinoId)

    if (!origen || !origen.estanque_config) {
      return { error: 'Estanque origen no encontrado' }
    }
    if (!destino || !destino.estanque_config) {
      return { error: 'Estanque destino no encontrado' }
    }

    const aguaDisponibleOrigen = origen.estanque_config.nivel_actual_m3
    const espacioDestino = destino.estanque_config.capacidad_m3 - destino.estanque_config.nivel_actual_m3
    const cantidadReal = Math.min(cantidad, aguaDisponibleOrigen, espacioDestino)

    if (cantidadReal <= 0) {
      return { error: 'No hay agua para transferir o destino lleno' }
    }

    const ts = getCurrentTimestamp()
    await transaccionesDAL.transferirAgua(
      origenId,
      {
        estanque_config: {
          ...origen.estanque_config,
          nivel_actual_m3: origen.estanque_config.nivel_actual_m3 - cantidadReal,
        },
        updated_at: ts,
      },
      destinoId,
      {
        estanque_config: {
          ...destino.estanque_config,
          nivel_actual_m3: destino.estanque_config.nivel_actual_m3 + cantidadReal,
        },
        updated_at: ts,
      },
    )

    onRefetch()
    return {}
  }, [estanques, onRefetch])

  const obtenerEstanquePrincipal = useCallback(() => {
    if (estanques.length === 0) return null

    return estanques.reduce((mayor, actual) => {
      const capacidadMayor = mayor.estanque_config?.capacidad_m3 || 0
      const capacidadActual = actual.estanque_config?.capacidad_m3 || 0
      return capacidadActual > capacidadMayor ? actual : mayor
    }, estanques[0])
  }, [estanques])

  return {
    estanques,
    aguaTotalDisponible,
    aguaTotalActual,
    agregarAgua,
    transferirAgua,
    obtenerEstanquePrincipal,
  }
}
