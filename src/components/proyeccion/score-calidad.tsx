'use client'

import type { ScoreCalidad, CategoriaCalidad } from '@/lib/utils/calidad'

interface ScoreCalidadPanelProps {
  score: ScoreCalidad
}

const COLORES_CATEGORIA: Record<CategoriaCalidad, string> = {
  excelente: 'bg-green-100 text-green-800 border-green-300',
  buena: 'bg-blue-100 text-blue-800 border-blue-300',
  aceptable: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  riesgosa: 'bg-orange-100 text-orange-800 border-orange-300',
  no_viable: 'bg-red-100 text-red-800 border-red-300',
}

const LABELS_CATEGORIA: Record<CategoriaCalidad, string> = {
  excelente: 'Excelente',
  buena: 'Buena',
  aceptable: 'Aceptable',
  riesgosa: 'Riesgosa',
  no_viable: 'No viable',
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? 'bg-green-500' : value >= 40 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 text-xs text-gray-600 text-right">{label}</span>
      <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }} />
      </div>
      <span className="w-8 text-xs text-gray-700 font-medium">{value}</span>
    </div>
  )
}

export function ScoreCalidadPanel({ score }: ScoreCalidadPanelProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h5 className="text-xs font-medium text-gray-700">Score de Calidad</h5>
        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${COLORES_CATEGORIA[score.categoria]}`}>
          {score.score_total}/100 - {LABELS_CATEGORIA[score.categoria]}
        </span>
      </div>

      <div className="space-y-1.5">
        <ScoreBar label="Agua" value={score.score_agua} />
        <ScoreBar label="Suelo" value={score.score_suelo} />
        <ScoreBar label="Clima" value={score.score_clima} />
        <ScoreBar label="Riego" value={score.score_riego} />
      </div>

      {score.factores_limitantes.length > 0 && (
        <div className="bg-red-50 p-2 rounded">
          <div className="text-xs font-medium text-red-800 mb-1">Factores limitantes</div>
          <ul className="text-xs text-red-700 space-y-0.5">
            {score.factores_limitantes.map((f, i) => (
              <li key={i}>- {f}</li>
            ))}
          </ul>
        </div>
      )}

      {score.mejoras_sugeridas.length > 0 && (
        <div className="bg-blue-50 p-2 rounded">
          <div className="text-xs font-medium text-blue-800 mb-1">Mejoras sugeridas</div>
          <ul className="text-xs text-blue-700 space-y-0.5">
            {score.mejoras_sugeridas.map((m, i) => (
              <li key={i}>- {m}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
