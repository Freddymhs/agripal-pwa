'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { SueloTerreno, TexturaSuelo, DrenajeSuelo } from '@/types'
import { UMBRALES_SUELO } from '@/lib/data/umbrales-suelo'

interface FormularioSueloProps {
  suelo?: SueloTerreno
  onChange: (suelo: SueloTerreno) => void
}

type NivelIndicador = 'ok' | 'advertencia' | 'critico' | 'neutral'

function getIndicador(valor: number | undefined, umbral: { max?: number; min?: number }): NivelIndicador {
  if (valor === undefined) return 'neutral'
  if (umbral.max !== undefined && valor > umbral.max) return 'critico'
  if (umbral.min !== undefined && valor < umbral.min) return 'critico'
  if (umbral.max !== undefined && umbral.min !== undefined) {
    const rango = umbral.max - umbral.min
    if (valor < umbral.min + rango * 0.15 || valor > umbral.max - rango * 0.15) return 'advertencia'
    return 'ok'
  }
  if (umbral.max !== undefined && valor > umbral.max * 0.75) return 'advertencia'
  return 'ok'
}

function safeParseFloat(val: string): number | undefined {
  if (val === '') return undefined
  const num = parseFloat(val)
  return Number.isNaN(num) ? undefined : num
}

function safeParseInt(val: string): number | undefined {
  if (val === '') return undefined
  const num = parseInt(val)
  return Number.isNaN(num) ? undefined : num
}

const coloresIndicador: Record<NivelIndicador, string> = {
  ok: 'border-green-500 bg-green-50',
  advertencia: 'border-yellow-500 bg-yellow-50',
  critico: 'border-red-500 bg-red-50',
  neutral: 'border-gray-300',
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function FormularioSuelo({ suelo, onChange }: FormularioSueloProps) {
  const [fisico, setFisico] = useState(suelo?.fisico || {})
  const [quimico, setQuimico] = useState(suelo?.quimico || {})
  const isInitialMount = useRef(true)
  const lastSuelo = useRef(suelo)

  // Solo sincronizar desde props si realmente cambió externamente
  useEffect(() => {
    if (suelo && !deepEqual(suelo, lastSuelo.current)) {
      if (suelo.fisico && !deepEqual(suelo.fisico, fisico)) {
        setFisico(suelo.fisico)
      }
      if (suelo.quimico && !deepEqual(suelo.quimico, quimico)) {
        setQuimico(suelo.quimico)
      }
      lastSuelo.current = suelo
    }
  }, [suelo, fisico, quimico])

  // Notificar cambios al padre, pero no en el primer render
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    
    const newSuelo = { fisico, quimico }
    if (!deepEqual(newSuelo, lastSuelo.current)) {
      lastSuelo.current = newSuelo
      onChange(newSuelo)
    }
  }, [fisico, quimico, onChange])


  const texturas: { value: TexturaSuelo; label: string }[] = [
    { value: 'arenosa', label: 'Arenosa' },
    { value: 'franco-arenosa', label: 'Franco-arenosa' },
    { value: 'franco', label: 'Franco' },
    { value: 'franco-arcillosa', label: 'Franco-arcillosa' },
    { value: 'arcillosa', label: 'Arcillosa' },
  ]

  const drenajes: { value: DrenajeSuelo; label: string }[] = [
    { value: 'rapido', label: 'Rápido' },
    { value: 'bueno', label: 'Bueno' },
    { value: 'moderado', label: 'Moderado' },
    { value: 'lento', label: 'Lento' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Análisis Físico</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">pH</label>
            <input
              type="number"
              step="0.1"
              min={0}
              max={14}
              value={fisico.ph ?? ''}
              onChange={e => {
                setFisico({ ...fisico, ph: safeParseFloat(e.target.value.trim()) })
              }}
              placeholder="6.5 - 7.5"
              className={`w-full px-3 py-2 border rounded text-gray-900 ${
                coloresIndicador[getIndicador(fisico.ph, UMBRALES_SUELO.ph)]
              }`}
            />
            <p className="text-xs text-gray-500 mt-1">Óptimo: {UMBRALES_SUELO.ph.min} - {UMBRALES_SUELO.ph.max}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Materia Orgánica (%)</label>
            <input
              type="number"
              step="0.1"
              min={0}
              max={100}
              value={fisico.materia_organica_pct ?? ''}
              onChange={e => {
                setFisico({ ...fisico, materia_organica_pct: safeParseFloat(e.target.value.trim()) })
              }}
              placeholder="2 - 5%"
              className="w-full px-3 py-2 border rounded text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Textura</label>
            <select
              value={fisico.textura ?? ''}
              onChange={e => setFisico({ ...fisico, textura: e.target.value === '' ? undefined : e.target.value as TexturaSuelo })}
              className="w-full px-3 py-2 border rounded text-gray-900"
            >
              <option value="">Seleccionar...</option>
              {texturas.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Drenaje</label>
            <select
              value={fisico.drenaje ?? ''}
              onChange={e => setFisico({ ...fisico, drenaje: e.target.value === '' ? undefined : e.target.value as DrenajeSuelo })}
              className="w-full px-3 py-2 border rounded text-gray-900"
            >
              <option value="">Seleccionar...</option>
              {drenajes.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Profundidad efectiva (cm)</label>
            <input
              type="number"
              min={0}
              max={500}
              value={fisico.profundidad_efectiva_cm ?? ''}
              onChange={e => {
                setFisico({ ...fisico, profundidad_efectiva_cm: safeParseInt(e.target.value.trim()) })
              }}
              placeholder="Mín. 60cm para frutales"
              className={`w-full px-3 py-2 border rounded text-gray-900 ${
                coloresIndicador[getIndicador(fisico.profundidad_efectiva_cm, { min: UMBRALES_SUELO.profundidad_frutales.min })]
              }`}
            />
            <p className="text-xs text-gray-500 mt-1">Mínimo {UMBRALES_SUELO.profundidad_frutales.min}cm para frutales</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-medium text-gray-900 mb-3">Análisis Químico (CRÍTICO)</h3>

        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={quimico.analisis_realizado || false}
              onChange={e => setQuimico({ ...quimico, analisis_realizado: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm text-yellow-800 font-medium">Análisis de laboratorio realizado</span>
          </label>
          <p className="text-xs text-yellow-700 mt-1 ml-6">INIA La Platina ~$75,000 CLP</p>
        </div>

        {quimico.analisis_realizado && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha análisis</label>
              <input
                type="date"
                value={quimico.fecha_analisis ?? ''}
                onChange={e => setQuimico({ ...quimico, fecha_analisis: e.target.value })}
                className="w-full px-3 py-2 border rounded text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Laboratorio</label>
              <input
                type="text"
                value={quimico.laboratorio ?? ''}
                onChange={e => setQuimico({ ...quimico, laboratorio: e.target.value })}
                placeholder="INIA La Platina"
                className="w-full px-3 py-2 border rounded text-gray-900"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Salinidad (dS/m)
              <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.1"
              min={0}
              max={50}
              value={quimico.salinidad_dS_m ?? ''}
              onChange={e => {
                setQuimico({ ...quimico, salinidad_dS_m: safeParseFloat(e.target.value.trim()) })
              }}
              placeholder={`< ${UMBRALES_SUELO.salinidad.max}`}
              className={`w-full px-3 py-2 border rounded text-gray-900 ${
                coloresIndicador[getIndicador(quimico.salinidad_dS_m, UMBRALES_SUELO.salinidad)]
              }`}
            />
            <p className="text-xs text-gray-500 mt-1">Máx: {UMBRALES_SUELO.salinidad.max} dS/m</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Boro (mg/L)
              <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.1"
              min={0}
              max={100}
              value={quimico.boro_mg_l ?? ''}
              onChange={e => {
                setQuimico({ ...quimico, boro_mg_l: safeParseFloat(e.target.value.trim()) })
              }}
              placeholder={`< ${UMBRALES_SUELO.boro.max}`}
              className={`w-full px-3 py-2 border rounded text-gray-900 ${
                coloresIndicador[getIndicador(quimico.boro_mg_l, UMBRALES_SUELO.boro)]
              }`}
            />
            <p className="text-xs text-gray-500 mt-1">Máx: {UMBRALES_SUELO.boro.max} mg/L</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Arsénico (mg/L)
              <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min={0}
              max={10}
              value={quimico.arsenico_mg_l ?? ''}
              onChange={e => {
                setQuimico({ ...quimico, arsenico_mg_l: safeParseFloat(e.target.value.trim()) })
              }}
              placeholder={`< ${UMBRALES_SUELO.arsenico.max}`}
              className={`w-full px-3 py-2 border rounded text-gray-900 ${
                coloresIndicador[getIndicador(quimico.arsenico_mg_l, UMBRALES_SUELO.arsenico)]
              }`}
            />
            <p className="text-xs text-gray-500 mt-1">Máx: {UMBRALES_SUELO.arsenico.max} mg/L</p>
          </div>
        </div>

        <h4 className="font-medium text-gray-700 mt-4 mb-2 text-sm">Nutrientes (opcional)</h4>
        <div className="grid grid-cols-5 gap-2">
          <div>
            <label className="block text-xs text-gray-600 mb-1">N (ppm)</label>
            <input
              type="number"
              min={0}
              max={500}
              value={quimico.nitrogeno_ppm ?? ''}
              onChange={e => {
                setQuimico({ ...quimico, nitrogeno_ppm: safeParseFloat(e.target.value.trim()) })
              }}
              className="w-full px-2 py-1 border rounded text-sm text-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">P (ppm)</label>
            <input
              type="number"
              min={0}
              max={500}
              value={quimico.fosforo_ppm ?? ''}
              onChange={e => {
                setQuimico({ ...quimico, fosforo_ppm: safeParseFloat(e.target.value.trim()) })
              }}
              className="w-full px-2 py-1 border rounded text-sm text-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">K (ppm)</label>
            <input
              type="number"
              min={0}
              max={5000}
              value={quimico.potasio_ppm ?? ''}
              onChange={e => {
                setQuimico({ ...quimico, potasio_ppm: safeParseFloat(e.target.value.trim()) })
              }}
              className="w-full px-2 py-1 border rounded text-sm text-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Ca (ppm)</label>
            <input
              type="number"
              min={0}
              max={10000}
              value={quimico.calcio_ppm ?? ''}
              onChange={e => {
                setQuimico({ ...quimico, calcio_ppm: safeParseFloat(e.target.value.trim()) })
              }}
              className="w-full px-2 py-1 border rounded text-sm text-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Mg (ppm)</label>
            <input
              type="number"
              min={0}
              max={5000}
              value={quimico.magnesio_ppm ?? ''}
              onChange={e => {
                setQuimico({ ...quimico, magnesio_ppm: safeParseFloat(e.target.value.trim()) })
              }}
              className="w-full px-2 py-1 border rounded text-sm text-gray-900"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
