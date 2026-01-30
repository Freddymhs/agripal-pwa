'use client'

import type { TecnicasAhorroAgua } from '@/types'
import { TECNICAS_AHORRO_INFO, PROVEEDORES_HIDROGEL_CHILE } from '@/lib/data/umbrales-agua'

interface TecnicasAhorroProps {
  tecnicas?: TecnicasAhorroAgua
  onChange?: (tecnicas: TecnicasAhorroAgua) => void
  readOnly?: boolean
}

export function TecnicasAhorro({ tecnicas, onChange, readOnly = false }: TecnicasAhorroProps) {
  const handleToggle = (key: keyof TecnicasAhorroAgua) => {
    if (onChange) {
      onChange({ ...tecnicas, [key]: !tecnicas?.[key] })
    }
  }

  const items = [
    { key: 'riego_deficitario_controlado' as const, info: TECNICAS_AHORRO_INFO.riego_deficitario_controlado },
    { key: 'hidrogel' as const, info: TECNICAS_AHORRO_INFO.hidrogel },
    { key: 'mulch' as const, info: TECNICAS_AHORRO_INFO.mulch },
    { key: 'sensores_humedad' as const, info: TECNICAS_AHORRO_INFO.sensores_humedad },
  ]

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Técnicas de Ahorro de Agua</h3>

      <div className="space-y-3">
        {items.map(({ key, info }) => (
          <div
            key={key}
            className={`p-3 rounded-lg border ${
              tecnicas?.[key] ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {!readOnly && (
                <input
                  type="checkbox"
                  checked={tecnicas?.[key] || false}
                  onChange={() => handleToggle(key)}
                  className="mt-1 rounded"
                />
              )}
              {readOnly && (
                <span className={`w-5 h-5 flex items-center justify-center rounded text-xs ${
                  tecnicas?.[key] ? 'bg-green-500 text-white' : 'bg-gray-300 text-white'
                }`}>
                  {tecnicas?.[key] ? '✓' : '×'}
                </span>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{info.nombre}</span>
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                    Ahorro: {info.ahorro}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{info.descripcion}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t">
        <h4 className="font-medium text-gray-900 mb-2">Proveedores Hidrogel (Chile)</h4>
        <div className="grid grid-cols-1 gap-2">
          {PROVEEDORES_HIDROGEL_CHILE.map(prov => (
            <div key={prov.nombre} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
              <div>
                <span className="font-medium text-gray-900">{prov.nombre}</span>
                <span className="text-gray-500 ml-2">- {prov.ventaja}</span>
              </div>
              <a
                href={`https://${prov.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-xs"
              >
                {prov.url}
              </a>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Hidrogel Raindrops: envío gratis compras mayores a $60,000 CLP
        </p>
      </div>
    </div>
  )
}
