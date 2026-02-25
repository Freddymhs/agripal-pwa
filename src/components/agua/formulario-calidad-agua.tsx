'use client'

import { useState, useEffect } from 'react'
import type { CalidadAguaTerreno, FuenteAguaDetallada } from '@/types'
import { UMBRALES_AGUA, RIOS_ARICA } from '@/lib/data/umbrales-agua'

interface FormularioCalidadAguaProps {
  calidad?: CalidadAguaTerreno
  onChange: (calidad: CalidadAguaTerreno) => void
}

type NivelIndicador = 'ok' | 'advertencia' | 'critico' | 'neutral'

function getIndicador(valor: number | undefined, max: number): NivelIndicador {
  if (valor === undefined) return 'neutral'
  if (valor > max) return 'critico'
  if (valor > max * 0.75) return 'advertencia'
  return 'ok'
}

const coloresIndicador: Record<NivelIndicador, string> = {
  ok: 'border-green-500 bg-green-50',
  advertencia: 'border-yellow-500 bg-yellow-50',
  critico: 'border-red-500 bg-red-50',
  neutral: 'border-gray-300',
}

export function FormularioCalidadAgua({ calidad, onChange }: FormularioCalidadAguaProps) {
  const [data, setData] = useState<CalidadAguaTerreno>(calidad || {})

  useEffect(() => {
    onChange(data)
  }, [data, onChange])

  const fuentes: { value: FuenteAguaDetallada; label: string }[] = [
    { value: 'azapa', label: 'Río Azapa' },
    { value: 'lluta', label: 'Río Lluta (ALTO BORO)' },
    { value: 'aljibe', label: 'Aljibe/Camión' },
    { value: 'pozo', label: 'Pozo' },
    { value: 'otro', label: 'Otro' },
  ]

  const handleFuenteChange = (fuente: FuenteAguaDetallada) => {
    const rioData = fuente === 'lluta' ? RIOS_ARICA.lluta :
                    fuente === 'azapa' ? RIOS_ARICA.azapa :
                    fuente === 'aljibe' ? RIOS_ARICA.aljibe : null

    if (rioData) {
      setData({
        ...data,
        fuente,
        salinidad_dS_m: rioData.salinidad,
        boro_ppm: rioData.boro,
        arsenico_mg_l: rioData.arsenico,
      })
    } else {
      setData({ ...data, fuente })
    }
  }

  return (
    <div className="space-y-4">
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={data.analisis_realizado || false}
            onChange={e => setData({ ...data, analisis_realizado: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm text-yellow-800 font-medium">Análisis de laboratorio realizado</span>
        </label>
        <p className="text-xs text-yellow-700 mt-1 ml-6">INIA ~$75,000 CLP</p>
      </div>

      {data.analisis_realizado && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha análisis</label>
            <input
              type="date"
              value={data.fecha_analisis || ''}
              onChange={e => setData({ ...data, fecha_analisis: e.target.value })}
              className="w-full px-3 py-2 border rounded text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Laboratorio</label>
            <input
              type="text"
              value={data.laboratorio || ''}
              onChange={e => setData({ ...data, laboratorio: e.target.value })}
              placeholder="INIA"
              className="w-full px-3 py-2 border rounded text-gray-900"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Fuente de agua</label>
        <select
          value={data.fuente || ''}
          onChange={e => handleFuenteChange(e.target.value as FuenteAguaDetallada)}
          className="w-full px-3 py-2 border rounded text-gray-900"
        >
          <option value="">Seleccionar...</option>
          {fuentes.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
        {data.fuente === 'lluta' && (
          <p className="text-xs text-red-600 mt-1 font-medium">
            {RIOS_ARICA.lluta.nota}
          </p>
        )}
        {data.fuente === 'azapa' && (
          <p className="text-xs text-green-600 mt-1">
            {RIOS_ARICA.azapa.nota}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Salinidad (dS/m)
          </label>
          <input
            type="number"
            step="0.1"
            value={data.salinidad_dS_m ?? ''}
            onChange={e => setData({ ...data, salinidad_dS_m: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
            placeholder={`< ${UMBRALES_AGUA.salinidad.max}`}
            className={`w-full px-3 py-2 border rounded text-gray-900 ${
              coloresIndicador[getIndicador(data.salinidad_dS_m, UMBRALES_AGUA.salinidad.max)]
            }`}
          />
          <p className="text-xs text-gray-500 mt-1">Máx: {UMBRALES_AGUA.salinidad.max} dS/m</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Boro (ppm)
          </label>
          <input
            type="number"
            step="0.1"
            value={data.boro_ppm ?? ''}
            onChange={e => setData({ ...data, boro_ppm: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
            placeholder={`< ${UMBRALES_AGUA.boro.max}`}
            className={`w-full px-3 py-2 border rounded text-gray-900 ${
              coloresIndicador[getIndicador(data.boro_ppm, UMBRALES_AGUA.boro.max)]
            }`}
          />
          <p className="text-xs text-gray-500 mt-1">Máx: {UMBRALES_AGUA.boro.max} ppm</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Arsénico (mg/L)
          </label>
          <input
            type="number"
            step="0.01"
            value={data.arsenico_mg_l ?? ''}
            onChange={e => setData({ ...data, arsenico_mg_l: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
            placeholder={`< ${UMBRALES_AGUA.arsenico.max}`}
            className={`w-full px-3 py-2 border rounded text-gray-900 ${
              coloresIndicador[getIndicador(data.arsenico_mg_l, UMBRALES_AGUA.arsenico.max)]
            }`}
          />
          <p className="text-xs text-gray-500 mt-1">Máx: {UMBRALES_AGUA.arsenico.max} mg/L</p>
        </div>
      </div>

      <div className="pt-4 border-t">
        <label className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            checked={data.requiere_filtrado || false}
            onChange={e => setData({ ...data, requiere_filtrado: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm text-gray-700">Requiere filtrado/tratamiento</span>
        </label>

        {data.requiere_filtrado && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Costo filtrado mensual (CLP)</label>
            <input
              type="number"
              value={data.costo_filtrado_mensual ?? ''}
              onChange={e => setData({ ...data, costo_filtrado_mensual: parseInt(e.target.value) || undefined })}
              className="w-full px-3 py-2 border rounded text-gray-900"
            />
          </div>
        )}
      </div>
    </div>
  )
}
