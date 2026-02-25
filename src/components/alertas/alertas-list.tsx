'use client'

import type { Alerta, UUID } from '@/types'
import { SEVERIDAD_CONFIG } from '@/lib/constants/alertas'

interface AlertasListProps {
  alertas: Alerta[]
  onResolver: (id: UUID, como: string) => void
  onIgnorar: (id: UUID) => void
}

export function AlertasList({ alertas, onResolver, onIgnorar }: AlertasListProps) {
  if (alertas.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        ✅ No hay alertas activas
      </div>
    )
  }

  const ordenadas = [...alertas].sort((a, b) => {
    const orden = { critical: 0, warning: 1, info: 2 }
    return orden[a.severidad] - orden[b.severidad]
  })

  return (
    <div className="space-y-3">
      {ordenadas.map((alerta) => (
        <AlertaCard
          key={alerta.id}
          alerta={alerta}
          onResolver={onResolver}
          onIgnorar={onIgnorar}
        />
      ))}
    </div>
  )
}

function AlertaCard({
  alerta,
  onResolver,
  onIgnorar,
}: {
  alerta: Alerta
  onResolver: (id: UUID, como: string) => void
  onIgnorar: (id: UUID) => void
}) {
  const config = SEVERIDAD_CONFIG[alerta.severidad]

  return (
    <div className={`${config.bg} ${config.border} border rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <span className="text-xl">{config.icon}</span>
        <div className="flex-1">
          <h4 className={`font-medium ${config.color}`}>{alerta.titulo}</h4>
          <p className="text-sm text-gray-600 mt-1">{alerta.descripcion}</p>
          {alerta.sugerencia && (
            <p className="text-sm text-gray-500 mt-2 italic">
              💡 {alerta.sugerencia}
            </p>
          )}

          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onResolver(alerta.id, 'Resuelto manualmente')}
              className="text-sm px-3 py-1 bg-white rounded border hover:bg-gray-50"
            >
              Marcar resuelta
            </button>
            <button
              onClick={() => onIgnorar(alerta.id)}
              className="text-sm px-3 py-1 text-gray-500 hover:text-gray-700"
            >
              Ignorar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
