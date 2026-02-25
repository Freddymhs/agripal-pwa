'use client'

import { useState } from 'react'
import type { ContingenciasAgua, ProveedorAgua } from '@/types'
import { ESTADO_AGUA } from '@/lib/constants'

interface ContingenciasAguaProps {
  contingencias?: ContingenciasAgua
  proveedores?: ProveedorAgua[]
  aguaActualPct?: number
  onChange?: (contingencias: ContingenciasAgua) => void
}

export function ContingenciasAguaPanel({
  contingencias,
  proveedores,
  aguaActualPct = 100,
  onChange,
}: ContingenciasAguaProps) {
  const [planItem, setPlanItem] = useState('')

  const bufferMinimo = contingencias?.buffer_minimo_pct ?? 30
  const alertaCritica = contingencias?.alerta_critica_pct ?? 20

  const getNivelAlerta = () => {
    if (aguaActualPct <= alertaCritica) return ESTADO_AGUA.DEFICIT
    if (aguaActualPct <= bufferMinimo) return ESTADO_AGUA.AJUSTADO
    return ESTADO_AGUA.OK
  }

  const nivelAlerta = getNivelAlerta()

  const coloresNivel = {
    [ESTADO_AGUA.OK]: 'bg-green-100 text-green-800 border-green-200',
    [ESTADO_AGUA.AJUSTADO]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    [ESTADO_AGUA.DEFICIT]: 'bg-red-100 text-red-800 border-red-200',
  }

  const handleAddPlan = () => {
    if (planItem.trim() && onChange) {
      onChange({
        ...contingencias,
        plan_si_no_llega: [...(contingencias?.plan_si_no_llega || []), planItem.trim()],
      })
      setPlanItem('')
    }
  }

  const handleRemovePlan = (index: number) => {
    if (onChange) {
      const newPlan = [...(contingencias?.plan_si_no_llega || [])]
      newPlan.splice(index, 1)
      onChange({ ...contingencias, plan_si_no_llega: newPlan })
    }
  }

  const proveedoresAlternativos = proveedores?.filter(p => !p.es_principal) || []

  return (
    <div className="space-y-4">
      <div className={`p-4 rounded-lg border ${coloresNivel[nivelAlerta]}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold">
              {nivelAlerta === ESTADO_AGUA.OK && 'Estado: OK'}
              {nivelAlerta === ESTADO_AGUA.AJUSTADO && 'Estado: Ajustado'}
              {nivelAlerta === ESTADO_AGUA.DEFICIT && 'ALERTA CRÍTICA'}
            </h3>
            <p className="text-sm">
              Nivel actual: {aguaActualPct}%
            </p>
          </div>
          <div className="text-3xl">
            {nivelAlerta === ESTADO_AGUA.OK && '✅'}
            {nivelAlerta === ESTADO_AGUA.AJUSTADO && '⚠️'}
            {nivelAlerta === ESTADO_AGUA.DEFICIT && '🚨'}
          </div>
        </div>

        {nivelAlerta === ESTADO_AGUA.DEFICIT && (
          <div className="mt-3 pt-3 border-t border-red-200">
            <p className="text-sm font-medium">LLAMAR ALJIBE INMEDIATAMENTE</p>
            {proveedoresAlternativos.length > 0 && (
              <div className="mt-2 space-y-1">
                {proveedoresAlternativos.map(p => (
                  <div key={p.id} className="text-sm">
                    {p.nombre}: <span className="font-medium">{p.telefono || 'Sin teléfono'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <h4 className="font-medium text-gray-900 mb-2">Umbrales de Alerta</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Buffer mínimo (%)</label>
            <input
              type="number"
              value={bufferMinimo}
              onChange={e => onChange?.({ ...contingencias, buffer_minimo_pct: parseInt(e.target.value) || 30 })}
              className="w-full px-3 py-2 border rounded text-gray-900"
            />
            <p className="text-xs text-gray-500 mt-1">Nunca bajar de este nivel</p>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Alerta crítica (%)</label>
            <input
              type="number"
              value={alertaCritica}
              onChange={e => onChange?.({ ...contingencias, alerta_critica_pct: parseInt(e.target.value) || 20 })}
              className="w-full px-3 py-2 border rounded text-gray-900"
            />
            <p className="text-xs text-gray-500 mt-1">Llamar aljibe inmediatamente</p>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-medium text-gray-900 mb-2">Plan si no llega agua</h4>
        <div className="space-y-2 mb-2">
          {(contingencias?.plan_si_no_llega || []).map((item, i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">{i + 1}.</span>
              <span className="text-sm text-gray-900 flex-1">{item}</span>
              <button
                onClick={() => handleRemovePlan(i)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={planItem}
            onChange={e => setPlanItem(e.target.value)}
            placeholder="Agregar acción..."
            className="flex-1 px-3 py-2 border rounded text-gray-900 text-sm"
            onKeyDown={e => e.key === 'Enter' && handleAddPlan()}
          />
          <button
            onClick={handleAddPlan}
            className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            +
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Ejemplos: Llamar proveedor X, Reducir riego 50%, Activar reserva de emergencia
        </p>
      </div>

      {proveedoresAlternativos.length > 0 && (
        <div className="pt-4 border-t">
          <h4 className="font-medium text-gray-900 mb-2">Contactos de Emergencia</h4>
          <div className="space-y-2">
            {proveedoresAlternativos.map(p => (
              <div key={p.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                <span className="text-gray-900">{p.nombre}</span>
                <span className="font-medium text-gray-700">{p.telefono || 'Sin teléfono'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
