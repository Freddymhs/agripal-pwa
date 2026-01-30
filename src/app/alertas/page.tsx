'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { terrenosDAL, zonasDAL, catalogoDAL, plantasDAL } from '@/lib/dal'
import { useAlertas } from '@/hooks/use-alertas'
import { AlertasList } from '@/components/alertas/alertas-list'
import type { Terreno, Zona, Planta, CatalogoCultivo } from '@/types'

export default function AlertasPage() {
  const router = useRouter()
  const [terreno, setTerreno] = useState<Terreno | null>(null)
  const [zonas, setZonas] = useState<Zona[]>([])
  const [plantas, setPlantas] = useState<Planta[]>([])
  const [catalogoCultivos, setCatalogoCultivos] = useState<CatalogoCultivo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      const terrenoId = localStorage.getItem('terreno_actual')
      if (!terrenoId) {
        router.push('/')
        return
      }

      const t = await terrenosDAL.getById(terrenoId)
      if (!t) {
        router.push('/')
        return
      }

      const [z, p, c] = await Promise.all([
        zonasDAL.getByTerrenoId(terrenoId),
        plantasDAL.getAll(),
        catalogoDAL.getByProyectoId(t.proyecto_id),
      ])

      setTerreno(t)
      setZonas(z)
      setPlantas(p)
      setCatalogoCultivos(c)
      setLoading(false)
    }

    cargar()
  }, [router])

  const {
    alertas,
    alertasCriticas,
    loading: alertasLoading,
    resolverAlerta,
    ignorarAlerta,
  } = useAlertas(terreno, zonas, plantas, catalogoCultivos)

  if (loading || alertasLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Cargando alertas...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Alertas</h1>
            <p className="text-gray-600 mt-1">
              {alertas.length} alertas activas
              {alertasCriticas > 0 && (
                <span className="ml-2 text-red-600 font-medium">
                  ({alertasCriticas} críticas)
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
          >
            Volver al mapa
          </button>
        </div>

        <AlertasList
          alertas={alertas}
          onResolver={resolverAlerta}
          onIgnorar={ignorarAlerta}
        />
      </div>
    </div>
  )
}
