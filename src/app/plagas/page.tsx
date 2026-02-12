'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { terrenosDAL, zonasDAL, plantasDAL, catalogoDAL } from '@/lib/dal'
import { evaluarRiesgoPlagas, type RiesgoPlaga } from '@/lib/utils/riesgo-plagas'
import type { Zona, Planta, CatalogoCultivo, EtapaCrecimiento } from '@/types'

const ALERT_COLORS: Record<RiesgoPlaga['alertaNivel'], string> = {
  bajo: 'bg-green-50 border-green-200',
  medio: 'bg-yellow-50 border-yellow-200',
  alto: 'bg-orange-50 border-orange-200',
  critico: 'bg-red-50 border-red-200',
}

const ALERT_TEXT: Record<RiesgoPlaga['alertaNivel'], string> = {
  bajo: 'text-green-800',
  medio: 'text-yellow-800',
  alto: 'text-orange-800',
  critico: 'text-red-800',
}

const ALERT_BADGE: Record<RiesgoPlaga['alertaNivel'], string> = {
  bajo: 'bg-green-200 text-green-900',
  medio: 'bg-yellow-200 text-yellow-900',
  alto: 'bg-orange-200 text-orange-900',
  critico: 'bg-red-200 text-red-900',
}

export default function PlagasPage() {
  const [zonas, setZonas] = useState<Zona[]>([])
  const [plantas, setPlantas] = useState<Planta[]>([])
  const [catalogoCultivos, setCatalogoCultivos] = useState<CatalogoCultivo[]>([])
  const [loading, setLoading] = useState(true)
  const [zonaId, setZonaId] = useState<string>('')

  useEffect(() => {
    async function fetchData() {
      try {
        const terrenos = await terrenosDAL.getAll()
        if (terrenos.length > 0) {
          const t = terrenos[0]
          const [z, c] = await Promise.all([
            zonasDAL.getByTerrenoId(t.id),
            catalogoDAL.getByProyectoId(t.proyecto_id),
          ])
          setZonas(z)
          setCatalogoCultivos(c)
          const zonaIds = z.map(zona => zona.id)
          if (zonaIds.length > 0) {
            const p = await plantasDAL.getByZonaIds(zonaIds)
            setPlantas(p)
            const zonaCultivo = z.find(zona => zona.tipo === 'cultivo')
            if (zonaCultivo) setZonaId(zonaCultivo.id)
          }
        }
      } catch (err) {
        console.error('[PlagasPage] Error loading data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const zonasCultivo = zonas.filter(z => z.tipo === 'cultivo')

  const riesgos = useMemo<{ cultivo: CatalogoCultivo; etapa: EtapaCrecimiento; plagas: RiesgoPlaga[] }[]>(() => {
    const plantasZonaFiltradas = plantas.filter(p => p.zona_id === zonaId && p.estado !== 'muerta')
    if (!zonaId || plantasZonaFiltradas.length === 0) return []

    const cultivosPorTipo = new Map<string, { cultivo: CatalogoCultivo; etapa: EtapaCrecimiento }>()
    for (const p of plantasZonaFiltradas) {
      if (!cultivosPorTipo.has(p.tipo_cultivo_id)) {
        const cultivo = catalogoCultivos.find(c => c.id === p.tipo_cultivo_id)
        if (cultivo) {
          cultivosPorTipo.set(p.tipo_cultivo_id, { cultivo, etapa: p.etapa_actual })
        }
      }
    }

    return Array.from(cultivosPorTipo.values()).map(({ cultivo, etapa }) => ({
      cultivo,
      etapa,
      plagas: evaluarRiesgoPlagas(cultivo, etapa),
    }))
  }, [zonaId, plantas, catalogoCultivos])

  const totalAlertas = riesgos.reduce((sum, r) => sum + r.plagas.filter(p => p.alertaNivel !== 'bajo').length, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-amber-600 text-white px-4 py-3 flex items-center gap-4">
        <Link href="/" className="p-1 hover:bg-amber-700 rounded">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold">Predicción de Plagas</h1>
        {totalAlertas > 0 && (
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
            {totalAlertas}
          </span>
        )}
      </header>

      <main className="p-4 space-y-4 max-w-4xl mx-auto">
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg">
          <p className="text-sm text-amber-800">
            Evaluación de riesgo basada en <strong>temperatura actual</strong>, <strong>etapa del cultivo</strong> y <strong>severidad histórica</strong>.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Zona</label>
          <select
            value={zonaId}
            onChange={e => setZonaId(e.target.value)}
            className="w-full px-3 py-2 border rounded text-gray-900"
          >
            <option value="">Seleccionar zona...</option>
            {zonasCultivo.map(z => (
              <option key={z.id} value={z.id}>{z.nombre}</option>
            ))}
          </select>
        </div>

        {riesgos.length === 0 && zonaId && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-yellow-800 text-sm">No hay plantas activas en esta zona.</p>
          </div>
        )}

        {riesgos.map(({ cultivo, etapa, plagas }) => (
          <div key={cultivo.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">{cultivo.nombre}</h2>
              <span className="text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                Etapa: {etapa}
              </span>
            </div>

            {plagas.length === 0 && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <p className="text-green-800 text-sm">No hay plagas registradas para este cultivo.</p>
              </div>
            )}

            {plagas.map((riesgo, i) => (
              <div key={i} className={`border rounded-lg p-4 ${ALERT_COLORS[riesgo.alertaNivel]}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className={`font-bold ${ALERT_TEXT[riesgo.alertaNivel]}`}>
                      {riesgo.plaga.nombre}
                    </h3>
                    {riesgo.plaga.nombre_cientifico && (
                      <p className="text-xs text-gray-500 italic">{riesgo.plaga.nombre_cientifico}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded ${ALERT_BADGE[riesgo.alertaNivel]}`}>
                      {riesgo.alertaNivel.toUpperCase()} ({riesgo.scoreRiesgo}/100)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                  <div className={`p-2 rounded ${
                    riesgo.condicionesActuales.temperaturaFavorable ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {riesgo.condicionesActuales.temperaturaFavorable ? 'Temp. favorable' : 'Temp. desfavorable'}
                    ({riesgo.condicionesActuales.tempActual}°C)
                  </div>
                  <div className={`p-2 rounded ${
                    riesgo.condicionesActuales.etapaVulnerable ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {riesgo.condicionesActuales.etapaVulnerable ? 'Etapa vulnerable' : 'Etapa segura'}
                  </div>
                  {riesgo.plaga.severidad && (
                    <div className={`p-2 rounded ${
                      riesgo.plaga.severidad === 'critica' || riesgo.plaga.severidad === 'alta'
                        ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      Severidad: {riesgo.plaga.severidad}
                    </div>
                  )}
                </div>

                {riesgo.plaga.medidas_preventivas && riesgo.plaga.medidas_preventivas.length > 0 && (
                  <div className="mb-2">
                    <h4 className="text-xs font-medium text-gray-700 mb-1">Medidas preventivas:</h4>
                    <ul className="text-xs text-gray-600 space-y-0.5">
                      {riesgo.plaga.medidas_preventivas.map((m, j) => (
                        <li key={j}>- {m}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="text-xs text-gray-600 bg-white bg-opacity-50 p-2 rounded">
                  <strong>Control:</strong> {riesgo.plaga.control_recomendado || 'No especificado'}
                </div>
              </div>
            ))}
          </div>
        ))}

        {riesgos.length > 0 && totalAlertas === 0 && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
            <p className="text-green-800 font-medium">No hay riesgos altos detectados</p>
            <p className="text-green-700 text-sm mt-1">Las condiciones actuales son favorables para tus cultivos.</p>
          </div>
        )}
      </main>
    </div>
  )
}
