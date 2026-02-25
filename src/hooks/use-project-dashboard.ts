'use client'

import { useMemo } from 'react'
import { getTemporadaActual } from '@/lib/utils'
import { calcularConsumoTerreno, determinarEstadoAgua } from '@/lib/utils/agua'
import { FACTORES_TEMPORADA, TIPO_ZONA, ESTADO_PLANTA } from '@/lib/constants/entities'
import { DIAS_POR_SEMANA } from '@/lib/constants/conversiones'
import { useAlertas } from './use-alertas'
import type { Terreno, Zona, Planta, CatalogoCultivo, DashboardTerreno } from '@/types'

export function useProjectDashboard(
  terrenoActual: Terreno | null,
  zonas: Zona[],
  plantas: Planta[],
  catalogoCultivos: CatalogoCultivo[],
  alertasHook: ReturnType<typeof useAlertas>
): DashboardTerreno | null {
  return useMemo(() => {
    if (!terrenoActual) return null

    const areaUsada = zonas.reduce((sum, z) => sum + z.area_m2, 0)
    const areaTotal = terrenoActual.ancho_m * terrenoActual.alto_m
    const estanques = zonas.filter(z => z.tipo === TIPO_ZONA.ESTANQUE && z.estanque_config)
    const aguaEstanques = estanques.reduce((sum, e) => sum + (e.estanque_config?.nivel_actual_m3 || 0), 0)
    const aguaDisponible = estanques.length > 0 ? aguaEstanques : terrenoActual.agua_actual_m3
    const aguaNecesaria = calcularConsumoTerreno(zonas, plantas, catalogoCultivos)
    const estadoAgua = determinarEstadoAgua(aguaDisponible, aguaNecesaria)
    const diasRestantes = aguaNecesaria > 0 ? aguaDisponible / (aguaNecesaria / DIAS_POR_SEMANA) : Infinity
    const temporada = getTemporadaActual()
    const plantasPorCultivo: Record<string, number> = {}

    for (const planta of plantas) {
      if (planta.estado === ESTADO_PLANTA.MUERTA) continue
      const cultivo = catalogoCultivos.find(c => c.id === planta.tipo_cultivo_id)
      if (!cultivo) continue
      plantasPorCultivo[cultivo.nombre] = (plantasPorCultivo[cultivo.nombre] || 0) + 1
    }

    return {
      terreno_id: terrenoActual.id,
      area_total_m2: areaTotal,
      area_usada_m2: areaUsada,
      area_libre_m2: areaTotal - areaUsada,
      porcentaje_uso: (areaUsada / areaTotal) * 100,
      agua_disponible_m3: aguaDisponible,
      agua_necesaria_m3: aguaNecesaria,
      agua_margen_m3: aguaDisponible - aguaNecesaria,
      estado_agua: estadoAgua,
      dias_agua_restantes: diasRestantes,
      total_plantas: plantas.filter(p => p.estado !== ESTADO_PLANTA.MUERTA).length,
      plantas_por_cultivo: plantasPorCultivo,
      plantas_produciendo: plantas.filter(p => p.estado === ESTADO_PLANTA.PRODUCIENDO).length,
      plantas_muertas: plantas.filter(p => p.estado === ESTADO_PLANTA.MUERTA).length,
      alertas_activas: alertasHook.alertas.length,
      alertas_criticas: alertasHook.alertasCriticas,
      temporada_actual: temporada,
      factor_temporada: FACTORES_TEMPORADA[temporada],
    }
  }, [terrenoActual, zonas, plantas, catalogoCultivos, alertasHook.alertas.length, alertasHook.alertasCriticas])
}
