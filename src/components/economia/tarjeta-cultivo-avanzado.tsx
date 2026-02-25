import { formatCLP } from '@/lib/utils'
import { clamp } from '@/lib/utils/math'
import type { MetricasEconomicas } from '@/lib/utils/economia-avanzada'
import { MARGEN_BUENO_PCT, MARGEN_BAJO_PCT } from '@/lib/constants/umbrales'

interface TarjetaCultivoAvanzadoProps {
  cultivoNombre: string
  zonaNombre: string
  metricas: MetricasEconomicas
}

export function TarjetaCultivoAvanzado({ cultivoNombre, zonaNombre, metricas }: TarjetaCultivoAvanzadoProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900">{cultivoNombre}</h3>
        <span className="text-sm text-gray-500">{zonaNombre}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div className="bg-blue-50 p-3 rounded">
          <div className="text-xs text-blue-600">Costo/kg</div>
          <div className="font-bold text-blue-800">{formatCLP(metricas.costoProduccionKg)}</div>
          <div className="text-xs text-blue-500">vs venta {formatCLP(metricas.precioVentaKg)}</div>
        </div>
        <div className="bg-purple-50 p-3 rounded">
          <div className="text-xs text-purple-600">Punto Equilibrio</div>
          <div className="font-bold text-purple-800">
            {metricas.puntoEquilibrioKg != null
              ? `${Math.round(metricas.puntoEquilibrioKg).toLocaleString('es-CL')} kg`
              : 'No alcanzable'}
          </div>
          <div className="text-xs text-purple-500">
            de {Math.round(metricas.kgProducidosAño).toLocaleString('es-CL')} kg/ano
          </div>
        </div>
        <div className={`p-3 rounded ${
          metricas.margenContribucion > MARGEN_BUENO_PCT
            ? 'bg-green-50'
            : metricas.margenContribucion > MARGEN_BAJO_PCT
              ? 'bg-yellow-50'
              : 'bg-red-50'
        }`}>
          <div className="text-xs text-gray-600">Margen</div>
          <div className={`font-bold ${
            metricas.margenContribucion > MARGEN_BUENO_PCT
              ? 'text-green-800'
              : metricas.margenContribucion > MARGEN_BAJO_PCT
                ? 'text-yellow-800'
                : 'text-red-800'
          }`}>
            {Math.round(metricas.margenContribucion)}%
          </div>
        </div>
        <div className="bg-amber-50 p-3 rounded">
          <div className="text-xs text-amber-600">Recuperacion</div>
          <div className="font-bold text-amber-800">
            {metricas.tiempoRecuperacionMeses != null ? `${metricas.tiempoRecuperacionMeses} meses` : 'N/A'}
          </div>
        </div>
      </div>

      {metricas.kgProducidosAño > 0 && metricas.puntoEquilibrioKg != null && (
        <BreakEvenBar
          puntoEquilibrioKg={metricas.puntoEquilibrioKg}
          kgProducidosAño={metricas.kgProducidosAño}
        />
      )}
    </div>
  )
}

function BreakEvenBar({ puntoEquilibrioKg, kgProducidosAño }: { puntoEquilibrioKg: number; kgProducidosAño: number }) {
  const ratio = puntoEquilibrioKg / kgProducidosAño
  return (
    <div className="mt-3">
      <div className="text-xs text-gray-500 mb-1">
        Break-even: {Math.round(ratio * 100)}% de produccion
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${ratio < 0.6 ? 'bg-green-500' : 'bg-yellow-500'}`}
          style={{ width: `${clamp(ratio * 100, 0, 100)}%` }}
        />
      </div>
    </div>
  )
}
