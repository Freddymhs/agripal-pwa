'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PageLayout } from '@/components/layout'
import { terrenosDAL, zonasDAL, plantasDAL, catalogoDAL } from '@/lib/dal'
import { calcularROI, obtenerCostoAguaPromedio, type ProyeccionROI } from '@/lib/utils/roi'
import { calcularConsumoZona } from '@/lib/utils/agua'
import type { Terreno, Zona, Planta, CatalogoCultivo } from '@/types'

function formatCLP(n: number): string {
  return '$' + Math.round(n).toLocaleString('es-CL')
}

interface ResumenCultivo {
  cultivoId: string
  cultivoNombre: string
  zonaId: string
  zonaNombre: string
  numPlantas: number
  roi: ProyeccionROI
}

export default function EconomiaPage() {
  const [terreno, setTerreno] = useState<Terreno | null>(null)
  const [zonas, setZonas] = useState<Zona[]>([])
  const [plantas, setPlantas] = useState<Planta[]>([])
  const [catalogoCultivos, setCatalogoCultivos] = useState<CatalogoCultivo[]>([])
  const [loading, setLoading] = useState(true)
  const [resumen, setResumen] = useState<ResumenCultivo[]>([])

  useEffect(() => {
    async function fetchData() {
      const terrenos = await terrenosDAL.getAll()
      if (terrenos.length > 0) {
        const t = terrenos[0]
        setTerreno(t)

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
        }
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (!terreno || zonas.length === 0) return

    const estanques = zonas.filter(z => z.tipo === 'estanque' && z.estanque_config)
    const costoAguaM3 = obtenerCostoAguaPromedio(estanques, terreno)

    const zonasConCultivo = zonas.filter(z => z.tipo === 'cultivo')
    const resumenCalculado: ResumenCultivo[] = []

    for (const zona of zonasConCultivo) {
      const plantasZona = plantas.filter(p => p.zona_id === zona.id && p.estado !== 'muerta')
      if (plantasZona.length === 0) continue

      const cultivosPorTipo = plantasZona.reduce((acc, p) => {
        acc[p.tipo_cultivo_id] = (acc[p.tipo_cultivo_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      for (const [cultivoId, count] of Object.entries(cultivosPorTipo)) {
        const cultivo = catalogoCultivos.find(c => c.id === cultivoId)
        if (!cultivo) continue

        const plantasCultivo = plantasZona.filter(p => p.tipo_cultivo_id === cultivoId)
        const consumoCultivo = calcularConsumoZona(zona, plantasCultivo, catalogoCultivos)
        const roi = calcularROI(cultivo, zona, count, costoAguaM3, consumoCultivo, terreno?.suelo ?? null)
        resumenCalculado.push({
          cultivoId,
          cultivoNombre: cultivo.nombre,
          zonaId: zona.id,
          zonaNombre: zona.nombre,
          numPlantas: count,
          roi,
        })
      }
    }

    setResumen(resumenCalculado)
  }, [terreno, zonas, plantas, catalogoCultivos])

  const totalInversion = resumen.reduce((sum, r) => sum + r.roi.inversion_total, 0)
  const totalIngresoAcumulado = resumen.reduce((sum, r) => sum + r.roi.ingreso_acumulado_4años, 0)
  const totalCostoAgua = resumen.reduce((sum, r) => sum + r.roi.costo_agua_anual, 0)
  const roiGlobal = totalInversion > 0
    ? ((totalIngresoAcumulado - totalInversion) / totalInversion) * 100
    : 0

  if (loading) {
    return (
      <PageLayout headerColor="emerald">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Cargando...</div>
        </div>
      </PageLayout>
    )
  }

  if (!terreno) {
    return (
      <PageLayout headerColor="emerald">
        <main className="p-4">
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
            <p className="text-yellow-800">No hay terrenos creados.</p>
          </div>
        </main>
      </PageLayout>
    )
  }

  return (
    <PageLayout headerColor="emerald">
      <main className="p-4 space-y-4 max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4">💰 Resumen Global (4 años)</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-700">{formatCLP(totalInversion)}</div>
              <div className="text-xs text-blue-600">Inversión Total</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-700">{formatCLP(totalIngresoAcumulado)}</div>
              <div className="text-xs text-green-600">Ingreso Neto (4 años)</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-700">{formatCLP(totalCostoAgua)}</div>
              <div className="text-xs text-purple-600">Costo Agua/año</div>
            </div>
            <div className={`p-3 rounded-lg text-center ${roiGlobal > 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <div className={`text-2xl font-bold ${roiGlobal > 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {Math.round(roiGlobal)}%
              </div>
              <div className={`text-xs ${roiGlobal > 0 ? 'text-emerald-600' : 'text-red-600'}`}>ROI Global</div>
            </div>
          </div>

          <div className={`p-3 rounded-lg text-sm ${roiGlobal > 50 ? 'bg-green-100 text-green-800' : roiGlobal > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
            {roiGlobal > 50
              ? '✅ Excelente rentabilidad proyectada'
              : roiGlobal > 0
                ? '⚠️ Rentabilidad ajustada - considera optimizar cultivos'
                : '❌ Proyección con pérdidas - revisa tu estrategia'}
          </div>
        </div>

        {resumen.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-yellow-800">
              No hay plantas cultivadas. Agrega plantas a tus zonas desde el mapa para ver proyecciones económicas.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <h2 className="text-lg font-bold text-gray-900 p-4 border-b">Detalle por Cultivo</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-700">Cultivo</th>
                    <th className="text-left p-3 font-medium text-gray-700">Zona</th>
                    <th className="text-right p-3 font-medium text-gray-700">Plantas</th>
                    <th className="text-right p-3 font-medium text-gray-700">Inversión</th>
                    <th className="text-right p-3 font-medium text-gray-700">Ingreso 4a</th>
                    <th className="text-right p-3 font-medium text-gray-700">ROI</th>
                    <th className="text-right p-3 font-medium text-gray-700">Equilibrio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {resumen.map((r, i) => (
                    <tr key={`${r.zonaId}-${r.cultivoId}-${i}`} className="hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-900">{r.cultivoNombre}</td>
                      <td className="p-3 text-gray-600">{r.zonaNombre}</td>
                      <td className="p-3 text-right text-gray-900">{r.numPlantas}</td>
                      <td className="p-3 text-right text-gray-900">{formatCLP(r.roi.inversion_total)}</td>
                      <td className="p-3 text-right text-green-700 font-medium">{formatCLP(r.roi.ingreso_acumulado_4años)}</td>
                      <td className={`p-3 text-right font-bold ${r.roi.viable ? 'text-green-700' : 'text-red-700'}`}>
                        {r.roi.roi_4_años_pct}%
                      </td>
                      <td className="p-3 text-right text-gray-600">
                        {r.roi.punto_equilibrio_meses != null ? `${r.roi.punto_equilibrio_meses}m` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h3 className="text-sm font-bold text-blue-900 mb-2">📊 ¿Cómo se calcula?</h3>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• <strong>Inversión:</strong> Costo plantas + agua año 1</li>
            <li>• <strong>Ingreso neto:</strong> Producción × Precio - Costos operación (años 2-4)</li>
            <li>• <strong>ROI:</strong> (Ingreso neto - Inversión) / Inversión × 100</li>
            <li>• <strong>Equilibrio:</strong> Mes donde recuperas la inversión inicial</li>
          </ul>
        </div>
      </main>
    </PageLayout>
  )
}
