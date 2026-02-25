'use client'

import { useState } from 'react'
import type { CatalogoCultivo, Tolerancia, ToleranciaSimple, Tier, Riesgo, ToleranciaHeladas } from '@/types'
import { CultivoClimaFields } from './cultivo-clima-fields'

interface CultivoFormProps {
  cultivo?: CatalogoCultivo
  onGuardar: (data: Partial<CatalogoCultivo>) => void
  onCancelar: () => void
}

export function CultivoForm({ cultivo, onGuardar, onCancelar }: CultivoFormProps) {
  const [nombre, setNombre] = useState(cultivo?.nombre || '')
  const [nombreCientifico, setNombreCientifico] = useState(cultivo?.nombre_cientifico || '')
  const [aguaMin, setAguaMin] = useState(cultivo?.agua_m3_ha_año_min || 3000)
  const [aguaMax, setAguaMax] = useState(cultivo?.agua_m3_ha_año_max || 5000)
  const [espaciadoMin, setEspaciadoMin] = useState(cultivo?.espaciado_min_m || 0.3)
  const [espaciadoRec, setEspaciadoRec] = useState(cultivo?.espaciado_recomendado_m || 0.5)
  const [toleranciaBoro, setToleranciaBoro] = useState<Tolerancia>(cultivo?.tolerancia_boro || 'media')
  const [toleranciaSalinidad, setToleranciaSalinidad] = useState<ToleranciaSimple>(cultivo?.tolerancia_salinidad || 'media')
  const [tiempoProduccion, setTiempoProduccion] = useState(cultivo?.tiempo_produccion_meses || 24)
  const [vidaUtil, setVidaUtil] = useState(cultivo?.vida_util_años || 20)
  const [precioMin, setPrecioMin] = useState(cultivo?.precio_kg_min_clp || 0)
  const [precioMax, setPrecioMax] = useState(cultivo?.precio_kg_max_clp || 0)
  const [tier, setTier] = useState<Tier>(cultivo?.tier || 2)
  const [riesgo, setRiesgo] = useState<Riesgo>(cultivo?.riesgo || 'medio')
  const [notas, setNotas] = useState(cultivo?.notas || '')
  const [tempMin, setTempMin] = useState<number | undefined>(cultivo?.clima?.temp_min_c)
  const [tempMax, setTempMax] = useState<number | undefined>(cultivo?.clima?.temp_max_c)
  const [toleranciaHeladas, setToleranciaHeladas] = useState<ToleranciaHeladas | undefined>(cultivo?.clima?.tolerancia_heladas)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onGuardar({
      nombre,
      nombre_cientifico: nombreCientifico || undefined,
      agua_m3_ha_año_min: aguaMin,
      agua_m3_ha_año_max: aguaMax,
      espaciado_min_m: espaciadoMin,
      espaciado_recomendado_m: espaciadoRec,
      tolerancia_boro: toleranciaBoro,
      tolerancia_salinidad: toleranciaSalinidad,
      tiempo_produccion_meses: tiempoProduccion,
      vida_util_años: vidaUtil,
      precio_kg_min_clp: precioMin || undefined,
      precio_kg_max_clp: precioMax || undefined,
      tier,
      riesgo,
      notas,
      clima: (tempMin !== undefined || tempMax !== undefined || toleranciaHeladas) ? {
        temp_min_c: tempMin,
        temp_max_c: tempMax,
        tolerancia_heladas: toleranciaHeladas,
      } : undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-100px)]">
      <h3 className="text-lg font-bold">{cultivo ? 'Editar Cultivo' : 'Nuevo Cultivo'}</h3>

      <div>
        <label className="block text-sm font-medium mb-1">Nombre *</label>
        <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full px-3 py-2 border rounded" required />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Nombre científico</label>
        <input type="text" value={nombreCientifico} onChange={(e) => setNombreCientifico(e.target.value)} className="w-full px-3 py-2 border rounded" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium mb-1">Agua mín (m³/ha/año) *</label>
          <input type="number" value={aguaMin} onChange={(e) => setAguaMin(Number(e.target.value))} className="w-full px-3 py-2 border rounded" required min={1} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Agua máx *</label>
          <input type="number" value={aguaMax} onChange={(e) => setAguaMax(Number(e.target.value))} className="w-full px-3 py-2 border rounded" required min={1} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium mb-1">Espaciado mín (m) *</label>
          <input type="number" value={espaciadoMin} onChange={(e) => setEspaciadoMin(Number(e.target.value))} min={0.01} step={0.01} className="w-full px-3 py-2 border rounded" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Recomendado (m) *</label>
          <input type="number" value={espaciadoRec} onChange={(e) => setEspaciadoRec(Number(e.target.value))} min={0.01} step={0.01} className="w-full px-3 py-2 border rounded" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium mb-1">Producción (meses) *</label>
          <input type="number" value={tiempoProduccion} onChange={(e) => setTiempoProduccion(Number(e.target.value))} className="w-full px-3 py-2 border rounded" required min={1} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Vida útil (años)</label>
          <input type="number" value={vidaUtil} onChange={(e) => setVidaUtil(Number(e.target.value))} className="w-full px-3 py-2 border rounded" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium mb-1">Tier</label>
          <select value={tier} onChange={(e) => setTier(Number(e.target.value) as Tier)} className="w-full px-3 py-2 border rounded">
            <option value={1}>1 - Bajo riesgo</option>
            <option value={2}>2 - Medio</option>
            <option value={3}>3 - Alto potencial</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Riesgo</label>
          <select value={riesgo} onChange={(e) => setRiesgo(e.target.value as Riesgo)} className="w-full px-3 py-2 border rounded">
            <option value="bajo">Bajo</option>
            <option value="medio">Medio</option>
            <option value="alto">Alto</option>
          </select>
        </div>
      </div>

      <CultivoClimaFields
        tempMin={tempMin}
        tempMax={tempMax}
        toleranciaHeladas={toleranciaHeladas}
        onTempMinChange={setTempMin}
        onTempMaxChange={setTempMax}
        onToleranciaHeladasChange={setToleranciaHeladas}
      />

      <div>
        <label className="block text-sm font-medium mb-1">Notas</label>
        <textarea value={notas} onChange={(e) => setNotas(e.target.value)} className="w-full px-3 py-2 border rounded" rows={2} />
      </div>

      <div className="flex gap-2 pt-2">
        <button type="submit" className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600">Guardar</button>
        <button type="button" onClick={onCancelar} className="flex-1 bg-gray-200 py-2 rounded hover:bg-gray-300">Cancelar</button>
      </div>
    </form>
  )
}
