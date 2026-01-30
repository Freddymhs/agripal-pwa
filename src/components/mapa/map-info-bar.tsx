'use client'

import { useState } from 'react'
import { useProjectContext } from '@/contexts/project-context'

export function MapInfoBar() {
  const { dashboard, terrenoActual } = useProjectContext()
  const [collapsed, setCollapsed] = useState(false)

  if (!dashboard || !terrenoActual) return null

  if (collapsed) {
    return (
      <div className="border-b border-gray-100 bg-gray-50/50 px-4 py-0.5 flex items-center">
        <button
          onClick={() => setCollapsed(false)}
          className="text-xs text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          Panel de Información
        </button>
      </div>
    )
  }

  const diasAgua = dashboard.dias_agua_restantes
  const diasLabel = diasAgua === Infinity ? '∞' : `~${Math.floor(diasAgua)}`
  const diasColor =
    diasAgua === Infinity ? 'text-gray-500' :
    diasAgua > 14 ? 'text-green-700' :
    diasAgua > 7 ? 'text-yellow-700' : 'text-red-700'

  const aguaColor =
    dashboard.estado_agua === 'ok' ? 'text-green-700' :
    dashboard.estado_agua === 'ajustado' ? 'text-yellow-700' : 'text-red-700'

  return (
    <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200 px-4 py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 overflow-x-auto flex-wrap">
          <Metrica
            icon={<span className="text-gray-600">📏</span>}
            value={`${terrenoActual.ancho_m}×${terrenoActual.alto_m}`}
            label="m"
            sublabel={`${dashboard.area_total_m2} m²`}
          />

          <div className="w-px h-7 bg-gray-300" />

          <Metrica
            icon={<span className="text-blue-500">📐</span>}
            value={`${dashboard.porcentaje_uso.toFixed(0)}%`}
            label="uso"
            sublabel={`${dashboard.area_usada_m2} m² usados`}
          />

          <div className="w-px h-7 bg-gray-300" />

          <Metrica
            icon={<span className="text-green-600">🌱</span>}
            value={dashboard.total_plantas.toString()}
            label="plantas"
            sublabel={`${dashboard.plantas_produciendo} produciendo`}
          />

          <div className="w-px h-7 bg-gray-300" />

          <Metrica
            icon={<span className="text-cyan-600">💧</span>}
            value={`${dashboard.agua_disponible_m3.toFixed(1)}`}
            label="m³"
            sublabel={`consume ${dashboard.agua_necesaria_m3.toFixed(1)} m³/sem`}
            valueClass={aguaColor}
          />

          <div className="w-px h-7 bg-gray-300" />

          <Metrica
            icon={<span className="text-blue-600">📅</span>}
            value={diasLabel}
            label="días agua"
            sublabel={
              diasAgua === Infinity ? 'sin consumo activo' :
              diasAgua > 14 ? 'agua suficiente' :
              diasAgua > 7 ? 'planifica recarga' : '⚠️ recarga pronto'
            }
            valueClass={diasColor}
          />

          <div className="w-px h-7 bg-gray-300" />

          <Metrica
            icon={<span className="text-orange-500">🌤️</span>}
            value={dashboard.temporada_actual}
            label=""
            sublabel={`factor ×${dashboard.factor_temporada.toFixed(1)}`}
            valueClass="capitalize"
          />

          {dashboard.alertas_activas > 0 && (
            <>
              <div className="w-px h-7 bg-gray-300" />
              <Metrica
                icon={<span>{dashboard.alertas_criticas > 0 ? '🔴' : '⚠️'}</span>}
                value={dashboard.alertas_activas.toString()}
                label={dashboard.alertas_activas === 1 ? 'alerta' : 'alertas'}
                sublabel={dashboard.alertas_criticas > 0 ? `${dashboard.alertas_criticas} críticas` : 'revisar'}
                valueClass={dashboard.alertas_criticas > 0 ? 'text-red-700' : 'text-yellow-700'}
              />
            </>
          )}
        </div>

        <button
          onClick={() => setCollapsed(true)}
          className="text-gray-400 hover:text-gray-600 transition-colors shrink-0 p-1"
          title="Ocultar panel de información"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function Metrica({
  icon,
  value,
  label,
  sublabel,
  valueClass = 'text-gray-900',
}: {
  icon: React.ReactNode
  value: string
  label: string
  sublabel?: string
  valueClass?: string
}) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <div className="text-sm leading-none">{icon}</div>
      <div className="flex flex-col">
        <div className="flex items-baseline gap-1">
          <span className={`text-sm font-bold leading-none ${valueClass}`}>{value}</span>
          <span className="text-xs text-gray-500 leading-none">{label}</span>
        </div>
        {sublabel && (
          <span className="text-[10px] text-gray-400 leading-tight">{sublabel}</span>
        )}
      </div>
    </div>
  )
}
