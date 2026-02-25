'use client'

import type { Recomendacion, CultivoRecomendado } from '@/lib/utils/recomendacion'
import type { CatalogoCultivo } from '@/types'

interface RecomendacionViablesProps {
  cultivos: Recomendacion['cultivos_viables']
  seleccionados: Array<{ cultivo: CatalogoCultivo }>
  areaHaFinal: number
  onToggle: (cultivo: CatalogoCultivo, area: number, selected: boolean) => void
}

export function RecomendacionViables({ cultivos, seleccionados, areaHaFinal, onToggle }: RecomendacionViablesProps) {
  if (cultivos.length === 0) return <div className="p-4 text-center text-gray-500 text-sm">No hay cultivos viables para este terreno</div>

  return (
    <div className="space-y-3">
      {cultivos.map(item => (
        <div key={item.cultivo.id} className="p-3 bg-green-50 rounded-lg border border-green-200 cursor-pointer hover:bg-green-100 transition-colors" onClick={() => { const isSelected = seleccionados.some(s => s.cultivo.id === item.cultivo.id); onToggle(item.cultivo, areaHaFinal, !isSelected) }}>
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium text-green-900">{item.cultivo.nombre}</h4>
            <input type="checkbox" checked={seleccionados.some(s => s.cultivo.id === item.cultivo.id)} onChange={() => {}} className="mt-0.5" />
          </div>
          <p className="text-xs text-green-800 mb-2">{item.razon}</p>
          <div className="text-xs text-gray-700 space-y-0.5">
            <div>💧 Agua: {item.cultivo.agua_m3_ha_año_min}-{item.cultivo.agua_m3_ha_año_max} m³/ha</div>
            <div>🏆 Score: {item.score.toFixed(1)}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

interface RecomendacionNoViablesProps {
  cultivos: Recomendacion['cultivos_noViables']
}

export function RecomendacionNoViables({ cultivos }: RecomendacionNoViablesProps) {
  if (cultivos.length === 0) return <div className="p-4 text-center text-gray-500 text-sm">Todos los cultivos son viables para este terreno</div>

  return (
    <div className="space-y-3">
      {cultivos.map(item => (
        <div key={item.cultivo.id} className="p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium text-red-900">{item.cultivo.nombre}</h4>
            <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded">❌</span>
          </div>
          <ul className="text-xs text-red-800 space-y-0.5">
            {item.razones.map((razon, i) => <li key={i}>• {razon}</li>)}
          </ul>
        </div>
      ))}
    </div>
  )
}

interface RecomendacionPlanProps {
  seleccionados: Array<{ cultivo: CatalogoCultivo; area_ha: number }>
  aguaDisponible: number
  aguaSeleccionados: { agua_anual: number }
  estadoAgua: { tipo: string; texto: string; color: string }
  onRemover: (cultivo: CatalogoCultivo, area: number) => void
}

export function RecomendacionPlan({ seleccionados, aguaDisponible, aguaSeleccionados, estadoAgua, onRemover }: RecomendacionPlanProps) {
  if (seleccionados.length === 0) return <div className="p-4 text-center text-gray-500 text-sm">Selecciona cultivos viables para construir tu plan</div>

  const margenAgua = aguaDisponible - aguaSeleccionados.agua_anual
  const porcentajeMargen = aguaDisponible > 0 ? (margenAgua / aguaDisponible) * 100 : 0

  return (
    <div className="space-y-3">
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {seleccionados.map(item => (
          <div key={item.cultivo.id} className="p-2 bg-blue-50 rounded border border-blue-200 flex items-start justify-between">
            <div className="text-sm text-blue-900 font-medium">{item.cultivo.nombre}</div>
            <button onClick={() => onRemover(item.cultivo, item.area_ha)} className="text-xs text-blue-600 hover:text-red-600 font-medium">✕</button>
          </div>
        ))}
      </div>

      <div className={`p-3 rounded-lg border-l-4 ${estadoAgua.color === 'red' ? 'bg-red-50 border-red-500' : estadoAgua.color === 'orange' ? 'bg-orange-50 border-orange-500' : estadoAgua.color === 'amber' ? 'bg-amber-50 border-amber-500' : 'bg-green-50 border-green-500'}`}>
        <div className="text-xs font-bold mb-2 text-gray-900">💧 Consumo Anual de Agua</div>
        <div className="space-y-1 text-xs text-gray-700">
          <div className="flex justify-between"><span>Agua disponible:</span><span className="font-medium">{aguaDisponible.toFixed(0)} m³</span></div>
          <div className="flex justify-between"><span>Agua requerida:</span><span className="font-medium">{aguaSeleccionados.agua_anual.toFixed(0)} m³</span></div>
          <div className="flex justify-between">
            <span>Margen:</span>
            <span className={`font-medium ${porcentajeMargen >= 20 ? 'text-green-700' : porcentajeMargen >= 10 ? 'text-amber-700' : 'text-red-700'}`}>{margenAgua.toFixed(0)} m³ ({porcentajeMargen.toFixed(1)}%)</span>
          </div>
          <div className="flex justify-between border-t pt-1 mt-1">
            <span>Estado:</span>
            <span className={`font-bold text-${estadoAgua.color}-700`}>{estadoAgua.texto}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
