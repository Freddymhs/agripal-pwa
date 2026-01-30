'use client'

import type { LegalTerreno } from '@/types'

interface ChecklistLegalProps {
  legal?: LegalTerreno
  compact?: boolean
}

interface CheckItem {
  key: string
  label: string
  checked: boolean
  critical?: boolean
}

export function ChecklistLegal({ legal, compact = false }: ChecklistLegalProps) {
  const items: CheckItem[] = [
    {
      key: 'inscripcion_sag',
      label: 'Inscripción SAG',
      checked: legal?.registro_agricola?.inscripcion_sag || false,
      critical: true,
    },
    {
      key: 'rut_agricola',
      label: 'RUT Agrícola',
      checked: !!legal?.registro_agricola?.rut_agricola,
    },
    {
      key: 'titulo_saneado',
      label: 'Título saneado',
      checked: legal?.titulo_saneado || false,
    },
    {
      key: 'contribuciones',
      label: 'Contribuciones al día',
      checked: legal?.contribuciones_al_dia || false,
    },
    {
      key: 'derechos_dga',
      label: 'Derechos de agua DGA',
      checked: legal?.derechos_agua?.tiene_derechos_dga || false,
    },
    {
      key: 'registro_indap',
      label: 'Registro INDAP',
      checked: legal?.registro_agricola?.registro_indap || false,
    },
  ]

  const completados = items.filter(i => i.checked).length
  const total = items.length
  const porcentaje = Math.round((completados / total) * 100)

  const criticalMissing = items.filter(i => i.critical && !i.checked)

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className={`text-sm font-medium ${porcentaje === 100 ? 'text-green-600' : porcentaje >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
          {porcentaje}% legal
        </div>
        {criticalMissing.length > 0 && (
          <span className="text-xs text-red-600">(!SAG)</span>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium text-gray-900">Estado Legal</h3>
        <div className={`text-sm font-medium ${porcentaje === 100 ? 'text-green-600' : porcentaje >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
          {completados}/{total} ({porcentaje}%)
        </div>
      </div>

      {criticalMissing.length > 0 && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
          <strong>Falta:</strong> {criticalMissing.map(i => i.label).join(', ')}
          <br />
          <span className="text-xs">Requerido para vender productos agrícolas</span>
        </div>
      )}

      <div className="space-y-2">
        {items.map(item => (
          <div key={item.key} className="flex items-center gap-2">
            <span className={`w-5 h-5 flex items-center justify-center rounded text-xs ${
              item.checked
                ? 'bg-green-100 text-green-600'
                : item.critical
                  ? 'bg-red-100 text-red-600'
                  : 'bg-gray-100 text-gray-400'
            }`}>
              {item.checked ? '✓' : '×'}
            </span>
            <span className={`text-sm ${item.checked ? 'text-gray-700' : 'text-gray-500'}`}>
              {item.label}
              {item.critical && !item.checked && (
                <span className="text-red-500 text-xs ml-1">(OBLIGATORIO)</span>
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              porcentaje === 100 ? 'bg-green-500' : porcentaje >= 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${porcentaje}%` }}
          />
        </div>
      </div>
    </div>
  )
}
