'use client'

import { useRouter } from 'next/navigation'
import { useProjectContext } from '@/contexts/project-context'
import { AlertasList } from '@/components/alertas/alertas-list'

export default function AlertasPage() {
  const router = useRouter()
  const { terrenoActual, loading, alertasHook } = useProjectContext()

  const {
    alertas,
    alertasCriticas,
    loading: alertasLoading,
    resolverAlerta,
    ignorarAlerta,
  } = alertasHook

  if (loading || alertasLoading || !terrenoActual) {
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
