'use client'

import type { CompatibilidadNivel } from '@/types'

interface CompatibilidadItem {
  cultivo_id: string
  cultivo_nombre: string
  nivel: CompatibilidadNivel
  problemas: string[]
}

interface EstanqueCompatibilidadProps {
  compatibilidades: CompatibilidadItem[]
}

const COLORES_COMPATIBILIDAD: Record<CompatibilidadNivel, string> = {
  compatible: 'text-green-700 bg-green-50',
  limitado: 'text-yellow-700 bg-yellow-50',
  no_compatible: 'text-red-700 bg-red-50',
}

const LABELS_COMPATIBILIDAD: Record<CompatibilidadNivel, string> = {
  compatible: 'Compatible',
  limitado: 'Limitado',
  no_compatible: 'No compatible',
}

export function EstanqueCompatibilidad({ compatibilidades }: EstanqueCompatibilidadProps) {
  if (compatibilidades.length === 0) return null

  return (
    <div className="space-y-1.5">
      <h5 className="text-xs font-medium text-gray-700">Compatibilidad agua - cultivos</h5>
      {compatibilidades.map(c => (
        <div key={c.cultivo_id} className={`p-2 rounded text-xs ${COLORES_COMPATIBILIDAD[c.nivel]}`}>
          <div className="flex justify-between items-center">
            <span className="font-medium">{c.cultivo_nombre}</span>
            <span className="font-bold">{LABELS_COMPATIBILIDAD[c.nivel]}</span>
          </div>
          {c.problemas.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {c.problemas.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}
