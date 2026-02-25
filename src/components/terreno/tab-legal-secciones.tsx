'use client'

import type { LegalTerreno } from '@/types'

interface TabLegalSeccionProps {
  value: LegalTerreno
  onChange: (v: LegalTerreno) => void
}

export function SeccionDerechosAgua({ value, onChange }: TabLegalSeccionProps) {
  return (
    <div>
      <h3 className="font-medium text-gray-900 mb-3">Derechos de Agua</h3>
      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.derechos_agua?.tiene_derechos_dga || false}
            onChange={e => onChange({
              ...value,
              derechos_agua: { ...value.derechos_agua, tiene_derechos_dga: e.target.checked }
            })}
            className="rounded"
          />
          <span className="text-sm text-gray-700">Tiene derechos DGA</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.derechos_agua?.inscripcion_junta_vigilancia || false}
            onChange={e => onChange({
              ...value,
              derechos_agua: { ...value.derechos_agua, inscripcion_junta_vigilancia: e.target.checked }
            })}
            className="rounded"
          />
          <span className="text-sm text-gray-700">Inscripcion Junta de Vigilancia</span>
        </label>
        {value.derechos_agua?.tiene_derechos_dga && (
          <div className="mt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Litros por segundo</label>
            <input
              type="number"
              step="0.1"
              value={value.derechos_agua?.litros_por_segundo || ''}
              onChange={e => onChange({
                ...value,
                derechos_agua: { ...value.derechos_agua, litros_por_segundo: parseFloat(e.target.value) || undefined }
              })}
              className="w-full px-3 py-2 border rounded text-gray-900"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export function SeccionPermisos({ value, onChange }: TabLegalSeccionProps) {
  return (
    <div>
      <h3 className="font-medium text-gray-900 mb-3">Permisos</h3>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.permisos?.permiso_edificacion || false}
            onChange={e => onChange({
              ...value,
              permisos: { ...value.permisos, permiso_edificacion: e.target.checked }
            })}
            className="rounded"
          />
          <span className="text-sm text-gray-700">Permiso edificacion</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.permisos?.resolucion_sanitaria || false}
            onChange={e => onChange({
              ...value,
              permisos: { ...value.permisos, resolucion_sanitaria: e.target.checked }
            })}
            className="rounded"
          />
          <span className="text-sm text-gray-700">Resolucion sanitaria</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.permisos?.declaracion_sii || false}
            onChange={e => onChange({
              ...value,
              permisos: { ...value.permisos, declaracion_sii: e.target.checked }
            })}
            className="rounded"
          />
          <span className="text-sm text-gray-700">Declaracion SII</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.permisos?.patente_municipal || false}
            onChange={e => onChange({
              ...value,
              permisos: { ...value.permisos, patente_municipal: e.target.checked }
            })}
            className="rounded"
          />
          <span className="text-sm text-gray-700">Patente municipal</span>
        </label>
      </div>
    </div>
  )
}

export function SeccionSeguros({ value, onChange }: TabLegalSeccionProps) {
  return (
    <div>
      <h3 className="font-medium text-gray-900 mb-3">Seguros</h3>
      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.seguros?.seguro_agricola || false}
            onChange={e => onChange({
              ...value,
              seguros: { ...value.seguros, seguro_agricola: e.target.checked }
            })}
            className="rounded"
          />
          <span className="text-sm text-gray-700">Seguro agricola</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.seguros?.seguro_incendio || false}
            onChange={e => onChange({
              ...value,
              seguros: { ...value.seguros, seguro_incendio: e.target.checked }
            })}
            className="rounded"
          />
          <span className="text-sm text-gray-700">Seguro incendio</span>
        </label>
        {(value.seguros?.seguro_agricola || value.seguros?.seguro_incendio) && (
          <div className="mt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Costo anual (CLP)</label>
            <input
              type="number"
              value={value.seguros?.costo_anual_clp || ''}
              onChange={e => onChange({
                ...value,
                seguros: { ...value.seguros, costo_anual_clp: parseInt(e.target.value) || undefined }
              })}
              className="w-full px-3 py-2 border rounded text-gray-900"
            />
          </div>
        )}
      </div>
    </div>
  )
}
