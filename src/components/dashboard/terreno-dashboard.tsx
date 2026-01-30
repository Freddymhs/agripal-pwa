'use client'

import type { DashboardTerreno } from '@/types'

interface TerrenoDashboardProps {
  dashboard: DashboardTerreno
}

export function TerrenoDashboard({ dashboard }: TerrenoDashboardProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <MetricaCard
          label="Área usada"
          value={`${dashboard.porcentaje_uso.toFixed(0)}%`}
          detail={`${dashboard.area_usada_m2} / ${dashboard.area_total_m2} m²`}
          color="blue"
        />
        <MetricaCard
          label="Agua disponible"
          value={`${dashboard.agua_disponible_m3.toFixed(1)} m³`}
          detail={`Consumo: ${dashboard.agua_necesaria_m3.toFixed(1)} m³/sem`}
          color={dashboard.estado_agua === 'ok' ? 'green' : dashboard.estado_agua === 'ajustado' ? 'yellow' : 'red'}
        />
        <MetricaCard
          label="Días de agua"
          value={
            dashboard.dias_agua_restantes === Infinity
              ? '∞'
              : `~${Math.floor(dashboard.dias_agua_restantes)}`
          }
          detail={
            dashboard.dias_agua_restantes === Infinity
              ? 'Sin consumo activo'
              : dashboard.dias_agua_restantes > 14
                ? 'Suficiente agua'
                : dashboard.dias_agua_restantes > 7
                  ? 'Planifica recarga'
                  : 'Recarga pronto'
          }
          color={
            dashboard.dias_agua_restantes === Infinity ? 'gray' :
            dashboard.dias_agua_restantes > 14 ? 'green' :
            dashboard.dias_agua_restantes > 7 ? 'yellow' : 'red'
          }
        />
        <MetricaCard
          label="Plantas"
          value={dashboard.total_plantas.toString()}
          detail={`${dashboard.plantas_produciendo} produciendo`}
          color="green"
        />
      </div>

      {dashboard.alertas_activas > 0 && (
        <div className={`rounded-lg p-3 ${
          dashboard.alertas_criticas > 0 ? 'bg-red-50 text-red-800' : 'bg-yellow-50 text-yellow-800'
        }`}>
          <div className="text-xs font-medium opacity-75">Alertas activas</div>
          <div className="text-lg font-bold leading-tight">{dashboard.alertas_activas}</div>
          <div className="text-xs opacity-60">
            {dashboard.alertas_criticas > 0 ? `${dashboard.alertas_criticas} críticas` : 'Revisa las alertas'}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg p-4 shadow">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-700">Temporada actual</h3>
            <p className="text-2xl font-bold capitalize">{dashboard.temporada_actual}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Factor de consumo</div>
            <div className="text-xl font-bold">
              ×{dashboard.factor_temporada.toFixed(1)}
            </div>
          </div>
        </div>
      </div>

      {Object.keys(dashboard.plantas_por_cultivo).length > 0 && (
        <div className="bg-white rounded-lg p-4 shadow">
          <h3 className="font-medium text-gray-700 mb-3">Plantas por cultivo</h3>
          <div className="space-y-2">
            {Object.entries(dashboard.plantas_por_cultivo).map(([cultivo, cantidad]) => (
              <div key={cultivo} className="flex justify-between items-center">
                <span className="text-gray-600">{cultivo}</span>
                <span className="font-medium">{cantidad}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {dashboard.plantas_muertas > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-red-500">☠️</span>
            <span className="text-red-800">
              {dashboard.plantas_muertas} planta(s) muerta(s) - considera removerlas
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricaCard({
  label,
  value,
  detail,
  color,
}: {
  label: string
  value: string
  detail: string
  color: 'blue' | 'green' | 'yellow' | 'red' | 'gray'
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-800',
    green: 'bg-green-50 text-green-800',
    yellow: 'bg-yellow-50 text-yellow-800',
    red: 'bg-red-50 text-red-800',
    gray: 'bg-gray-50 text-gray-800',
  }

  return (
    <div className={`rounded-lg p-3 ${colorClasses[color]}`}>
      <div className="text-xs font-medium opacity-75">{label}</div>
      <div className="text-lg font-bold leading-tight">{value}</div>
      <div className="text-xs opacity-60 truncate">{detail}</div>
    </div>
  )
}
