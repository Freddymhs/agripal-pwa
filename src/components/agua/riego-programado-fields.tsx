'use client'

import { clamp } from '@/lib/utils/math'

interface RiegoProgramadoFieldsProps {
  horasDia: number
  horarioInicio: string
  horarioFin: string
  caudalTotal: number
  consumoRecomendadoLDia?: number
  onHorasDiaChange: (h: number) => void
  onHorarioInicioChange: (v: string) => void
  onHorarioFinChange: (v: string) => void
}

export function RiegoProgramadoFields({
  horasDia, horarioInicio, horarioFin, caudalTotal, consumoRecomendadoLDia,
  onHorasDiaChange, onHorarioInicioChange, onHorarioFinChange,
}: RiegoProgramadoFieldsProps) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium mb-2">Horas de riego por día</label>
        <div className="flex gap-2 items-center">
          <input type="number" value={horasDia} onChange={(e) => onHorasDiaChange(clamp(Number(e.target.value), 1, 24))} min={1} max={24} className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500" />
          <span className="text-gray-600">h/día</span>
        </div>
        {consumoRecomendadoLDia != null && consumoRecomendadoLDia > 0 && caudalTotal > 0 && (() => {
          const horasRec = consumoRecomendadoLDia / caudalTotal
          if (horasRec > 24) return null
          const gastoActualL = caudalTotal * horasDia
          const ratio = gastoActualL / consumoRecomendadoLDia
          const porcentaje = Math.round(ratio * 100)
          const resumen = porcentaje < 70 ? `${porcentaje}% de lo recomendado (riego bajo).` : porcentaje <= 130 ? `${porcentaje}% de lo recomendado (casi igual).` : `${porcentaje}% de lo recomendado (riego alto).`
          return (
            <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-2">
              <p className="text-xs text-blue-800">Para este caudal (<strong>{caudalTotal} L/h</strong>), lo recomendado es regar <strong>~{horasRec.toFixed(1)} h/día</strong>.</p>
              <p className="text-[11px] text-blue-600 mt-0.5">Con tus <strong>{horasDia} h/día</strong> actuales riegas ~<strong>{Math.round(gastoActualL)} L/día</strong> ({resumen}).</p>
            </div>
          )
        })()}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-2">Inicio</label>
          <input type="time" value={horarioInicio} onChange={(e) => onHorarioInicioChange(e.target.value)} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Fin</label>
          <input type="time" value={horarioFin} onChange={(e) => onHorarioFinChange(e.target.value)} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
    </>
  )
}
