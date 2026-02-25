'use client'

import { useState } from 'react'
import { GOTEROS_DEFAULT } from '@/lib/constants/entities'

interface CaudalCalculadoraProps {
  numPlantasZona?: number
  caudalPorGoteroInicial?: number
  onUsarCaudal: (caudal: number) => void
}

export function CaudalCalculadora({ numPlantasZona, caudalPorGoteroInicial, onUsarCaudal }: CaudalCalculadoraProps) {
  const [goterosPorPlanta, setGoterosPorPlanta] = useState<number>(GOTEROS_DEFAULT.cantidad)
  const [caudalPorGotero, setCaudalPorGotero] = useState<number>(caudalPorGoteroInicial ?? GOTEROS_DEFAULT.caudal_lh_por_gotero)

  return (
    <div className="mt-2 border rounded-md p-2 bg-gray-50 space-y-2">
      <div className="grid grid-cols-3 gap-2 items-end">
        <div>
          <label className="block text-[11px] text-gray-600 mb-1">Goteros por planta</label>
          <input type="number" min={1} value={goterosPorPlanta} onChange={e => setGoterosPorPlanta(Math.max(1, Number(e.target.value)))} className="w-full px-2 py-1 border rounded text-xs" />
        </div>
        <div>
          <label className="block text-[11px] text-gray-600 mb-1">L/h por gotero</label>
          <input type="number" min={0.1} step={0.1} value={caudalPorGotero} onChange={e => setCaudalPorGotero(Math.max(0.1, Number(e.target.value)))} className="w-full px-2 py-1 border rounded text-xs" />
          <div className="flex gap-1 mt-1">
            {[2, 4, 8].map(v => (
              <button key={v} type="button" onClick={() => setCaudalPorGotero(v)} className={`px-1.5 py-0.5 text-[10px] rounded ${caudalPorGotero === v ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
                {v} L/h
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-[11px] text-gray-600 mb-1">Nº plantas</label>
          <div className="px-2 py-1 border rounded text-xs bg-white">{numPlantasZona ?? 0}</div>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <p className="text-[11px] text-gray-500">Caudal estimado = goteros × L/h × plantas.</p>
        <button
          type="button"
          disabled={!numPlantasZona || numPlantasZona <= 0}
          onClick={() => onUsarCaudal(goterosPorPlanta * caudalPorGotero * (numPlantasZona || 0))}
          className="px-2 py-1 text-[11px] rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Usar este caudal
        </button>
      </div>
      {(!numPlantasZona || numPlantasZona <= 0) && (
        <p className="text-[11px] text-amber-600">Agrega plantas a esta zona primero para poder calcular el caudal.</p>
      )}
    </div>
  )
}
