'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { PageLayout } from '@/components/layout'
import { FormularioSuelo, PanelSuelo, ChecklistSuelo, PlanBSuelo } from '@/components/suelo'
import { terrenosDAL, zonasDAL, catalogoDAL, plantasDAL } from '@/lib/dal'
import { ENMIENDAS_SUELO, sugerirEnmiendas } from '@/lib/data/enmiendas-suelo'
import { evaluarCompatibilidadSueloMultiple } from '@/lib/validations/suelo'
import type { SueloTerreno, CatalogoCultivo, Planta, Terreno } from '@/types'

const COLORES_COMPAT = {
  compatible: 'text-green-700 bg-green-50',
  limitado: 'text-yellow-700 bg-yellow-50',
  no_compatible: 'text-red-700 bg-red-50',
}

const LABELS_COMPAT = {
  compatible: 'Compatible',
  limitado: 'Limitado',
  no_compatible: 'No compatible',
}

export default function SueloPage() {
  const [terreno, setTerreno] = useState<Terreno | null>(null)
  const [suelo, setSuelo] = useState<SueloTerreno>({})
  const [catalogoCultivos, setCatalogoCultivos] = useState<CatalogoCultivo[]>([])
  const [plantas, setPlantas] = useState<Planta[]>([])
  const [activeTab, setActiveTab] = useState<'formulario' | 'resultados'>('formulario')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    const cargar = async () => {
      const terrenos = await terrenosDAL.getAll()
      if (terrenos.length > 0) {
        const t = terrenos[0]
        setTerreno(t)
        if (t.suelo) setSuelo(t.suelo)

        const [zonas, c] = await Promise.all([
          zonasDAL.getByTerrenoId(t.id),
          catalogoDAL.getByProyectoId(t.proyecto_id),
        ])
        setCatalogoCultivos(c)

        const zonaIds = zonas.map(z => z.id)
        if (zonaIds.length > 0) {
          const p = await plantasDAL.getByZonaIds(zonaIds)
          setPlantas(p)
        }
      }
    }
    cargar()
  }, [])

  const handleChange = useCallback(async (newSuelo: SueloTerreno) => {
    setSuelo(newSuelo)
    if (!terreno) return
    setGuardando(true)
    await terrenosDAL.update(terreno.id, {
      suelo: newSuelo,
      updated_at: new Date().toISOString(),
    })
    setGuardando(false)
  }, [terreno])

  const cultivosActivos = useMemo(() => {
    const ids = new Set<string>()
    for (const p of plantas) {
      if (p.estado !== 'muerta') ids.add(p.tipo_cultivo_id)
    }
    return catalogoCultivos.filter(c => ids.has(c.id))
  }, [plantas, catalogoCultivos])

  const compatibilidades = useMemo(() => {
    if (cultivosActivos.length === 0) return []
    if (!suelo.fisico?.ph && !suelo.quimico?.salinidad_dS_m && !suelo.quimico?.boro_mg_l) return []
    return evaluarCompatibilidadSueloMultiple(suelo, cultivosActivos)
  }, [suelo, cultivosActivos])

  const enmiendaSugeridas = useMemo(() => {
    const salinidadAlta = suelo.quimico?.salinidad_dS_m != null && suelo.quimico.salinidad_dS_m > 4
    return sugerirEnmiendas(suelo.fisico?.ph, salinidadAlta)
  }, [suelo])

  return (
    <PageLayout 
      headerColor="green"
      headerActions={guardando ? <span className="text-xs opacity-75">Guardando...</span> : undefined}
    >
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h2 className="font-bold text-blue-800 mb-1 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z"/>
            </svg>
            Estos datos afectan directamente tu ROI
          </h2>
          <p className="text-sm text-blue-700">
            Las propiedades del suelo impactan la <strong>producción esperada</strong> y los <strong>costos</strong>:
          </p>
          <ul className="text-sm text-blue-700 list-disc ml-5 mt-2 space-y-1">
            <li><strong>pH fuera de rango:</strong> reduce rendimiento 20-50%</li>
            <li><strong>Salinidad alta:</strong> reduce rendimiento 30-60%</li>
            <li><strong>Boro tóxico:</strong> reduce rendimiento 40-70%</li>
            <li><strong>Materia orgánica baja:</strong> reduce rendimiento 10%</li>
          </ul>
          <p className="text-sm text-blue-800 mt-2 font-medium">
            Actualmente usando datos promedio del Valle de Azapa.
            Para ROI preciso, realiza análisis de laboratorio (INIA ~$75,000 CLP).
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <h2 className="font-bold text-yellow-800 mb-1">Importante</h2>
          <p className="text-sm text-yellow-700">
            Sin análisis de suelo real, TODO es especulativo. Zona norte tiene riesgo ALTO de salinidad, boro y arsénico.
            <br />
            <strong>INIA La Platina:</strong> análisis completo ~$75,000 CLP -{' '}
            <a
              href="https://www.inia.cl/laboratorios/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              www.inia.cl/laboratorios
            </a>
          </p>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('formulario')}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              activeTab === 'formulario'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}
          >
            Ingresar Datos
          </button>
          <button
            onClick={() => setActiveTab('resultados')}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              activeTab === 'resultados'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}
          >
            Ver Resultados
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            {activeTab === 'formulario' ? (
              <div className="bg-white rounded-lg border p-4">
                <FormularioSuelo suelo={suelo} onChange={handleChange} />
              </div>
            ) : (
              <div className="space-y-4">
                <PanelSuelo suelo={suelo} />
                <PlanBSuelo suelo={suelo} />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <ChecklistSuelo suelo={suelo} />

            {compatibilidades.length > 0 && (
              <div className="bg-white rounded-lg border p-4">
                <h3 className="font-medium text-gray-800 mb-3">Compatibilidad suelo - cultivos</h3>
                <div className="space-y-2">
                  {compatibilidades.map(c => (
                    <div key={c.cultivo_id} className={`p-2 rounded text-xs ${COLORES_COMPAT[c.nivel]}`}>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{c.cultivo_nombre}</span>
                        <span className="font-bold">{LABELS_COMPAT[c.nivel]}</span>
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
              </div>
            )}

            {enmiendaSugeridas.length > 0 && (
              <div className="bg-white rounded-lg border p-4">
                <h3 className="font-medium text-gray-800 mb-3">Enmiendas sugeridas</h3>
                <div className="space-y-2">
                  {enmiendaSugeridas.map(e => (
                    <div key={e.id} className="bg-amber-50 p-2 rounded text-xs">
                      <div className="font-medium text-amber-900">{e.nombre}</div>
                      <div className="text-amber-700">
                        Dosis: {e.dosis_kg_m2} kg/m² | Efecto pH: {e.efecto_ph > 0 ? '+' : ''}{e.efecto_ph}
                      </div>
                      <div className="text-amber-600">{e.notas}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {ENMIENDAS_SUELO.length > 0 && (
              <div className="bg-white rounded-lg border p-4">
                <h3 className="font-medium text-gray-800 mb-3">Enmiendas disponibles</h3>
                <div className="space-y-1.5">
                  {ENMIENDAS_SUELO.map(e => (
                    <div key={e.id} className="bg-gray-50 p-2 rounded text-xs">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-900">{e.nombre}</span>
                        <span className="text-gray-500">${e.costo_kg_clp}/kg</span>
                      </div>
                      <div className="text-gray-500">
                        NPK: {e.npk.n}-{e.npk.p}-{e.npk.k} | {e.dosis_kg_m2} kg/m² | cada {e.frecuencia_meses} meses
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
