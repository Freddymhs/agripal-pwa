'use client'

import type { SueloTerreno } from '@/types'
import { evaluarSuelo, UMBRALES_SUELO } from '@/lib/data/umbrales-suelo'

interface PanelSueloProps {
  suelo?: SueloTerreno
}

export function PanelSuelo({ suelo }: PanelSueloProps) {
  const evaluacion = evaluarSuelo(suelo ? { fisico: suelo.fisico, quimico: suelo.quimico } : undefined)

  const estadoGeneral = {
    ok: { icono: '✅', texto: 'Apto', color: 'text-green-600 bg-green-50 border-green-200' },
    advertencia: { icono: '⚠️', texto: 'Limitado', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
    critico: { icono: '❌', texto: 'No apto', color: 'text-red-600 bg-red-50 border-red-200' },
  }[evaluacion.nivel]

  const parametros = [
    {
      nombre: 'Salinidad',
      valor: suelo?.quimico?.salinidad_dS_m,
      unidad: 'dS/m',
      max: UMBRALES_SUELO.salinidad.max,
    },
    {
      nombre: 'Boro',
      valor: suelo?.quimico?.boro_mg_l,
      unidad: 'mg/L',
      max: UMBRALES_SUELO.boro.max,
    },
    {
      nombre: 'Arsénico',
      valor: suelo?.quimico?.arsenico_mg_l,
      unidad: 'mg/L',
      max: UMBRALES_SUELO.arsenico.max,
    },
  ]

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className={`p-4 border-b ${estadoGeneral.color}`}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{estadoGeneral.icono}</span>
          <div>
            <h3 className="font-bold">Estado del Suelo: {estadoGeneral.texto}</h3>
            {!suelo?.quimico?.analisis_realizado && (
              <p className="text-sm opacity-75">Sin análisis de laboratorio verificado</p>
            )}
          </div>
        </div>
      </div>

      {evaluacion.problemas.length > 0 && (
        <div className="p-4 border-b bg-red-50">
          <h4 className="font-medium text-red-800 mb-2">Problemas Críticos</h4>
          <ul className="space-y-1">
            {evaluacion.problemas.map((p, i) => (
              <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                <span>×</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {evaluacion.advertencias.length > 0 && (
        <div className="p-4 border-b bg-yellow-50">
          <h4 className="font-medium text-yellow-800 mb-2">Advertencias</h4>
          <ul className="space-y-1">
            {evaluacion.advertencias.map((a, i) => (
              <li key={i} className="text-sm text-yellow-700 flex items-start gap-2">
                <span>!</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="p-4">
        <h4 className="font-medium text-gray-900 mb-3">Parámetros Críticos</h4>
        <div className="space-y-3">
          {parametros.map(param => {
            const porcentaje = param.valor !== undefined ? Math.min(100, Math.max(0, (param.valor / param.max) * 100)) : 0
            const excede = param.valor !== undefined && param.valor > param.max

            return (
              <div key={param.nombre}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{param.nombre}</span>
                  <span className={`font-medium ${excede ? 'text-red-600' : 'text-gray-900'}`}>
                    {param.valor !== undefined ? `${param.valor} ${param.unidad}` : 'Sin datos'}
                    <span className="text-gray-400 text-xs ml-1">(máx: {param.max})</span>
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      excede ? 'bg-red-500' : porcentaje > 75 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(100, porcentaje)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {suelo?.fisico && (
        <div className="p-4 border-t">
          <h4 className="font-medium text-gray-900 mb-3">Propiedades Físicas</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {suelo.fisico.ph !== undefined && (
              <div>
                <span className="text-gray-500">pH:</span>
                <span className="ml-2 font-medium text-gray-900">{suelo.fisico.ph}</span>
              </div>
            )}
            {suelo.fisico.textura && (
              <div>
                <span className="text-gray-500">Textura:</span>
                <span className="ml-2 font-medium text-gray-900 capitalize">{suelo.fisico.textura}</span>
              </div>
            )}
            {suelo.fisico.drenaje && (
              <div>
                <span className="text-gray-500">Drenaje:</span>
                <span className="ml-2 font-medium text-gray-900 capitalize">{suelo.fisico.drenaje}</span>
              </div>
            )}
            {suelo.fisico.profundidad_efectiva_cm !== undefined && (
              <div>
                <span className="text-gray-500">Profundidad:</span>
                <span className="ml-2 font-medium text-gray-900">{suelo.fisico.profundidad_efectiva_cm} cm</span>
              </div>
            )}
            {suelo.fisico.materia_organica_pct !== undefined && (
              <div>
                <span className="text-gray-500">Materia orgánica:</span>
                <span className="ml-2 font-medium text-gray-900">{suelo.fisico.materia_organica_pct}%</span>
              </div>
            )}
          </div>
        </div>
      )}

      {suelo?.quimico?.analisis_realizado && suelo.quimico.fecha_analisis && (
        <div className="p-3 bg-gray-50 text-xs text-gray-500 border-t">
          Análisis: {suelo.quimico.laboratorio || 'Laboratorio'} - {suelo.quimico.fecha_analisis}
        </div>
      )}
    </div>
  )
}
