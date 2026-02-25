'use client'

import { useState } from 'react'
import type { ProyeccionROI } from '@/lib/utils/roi'
import { formatCLP } from '@/lib/utils'

interface ROIPanelProps {
  roi: ProyeccionROI
}

export function ROIPanel({ roi }: ROIPanelProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <h5 className="text-xs font-medium text-gray-700">Proyección ROI</h5>
          <div
            className="relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <button
              type="button"
              className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-[10px] leading-none flex items-center justify-center hover:bg-gray-300"
              aria-label="Info sobre factores del ROI"
            >
              i
            </button>
            {showTooltip && (
              <div className="absolute left-0 top-6 z-50 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-[11px]">
                <div className="mb-2">
                  <div className="font-semibold text-green-700 mb-1">Incluido en el cálculo:</div>
                  <ul className="space-y-0.5 text-green-800">
                    <li>Plantas vivas en la zona</li>
                    <li>Producción esperada por planta/año</li>
                    <li>Precio promedio de venta (min+max)/2</li>
                    <li>Consumo real de agua (Kc x etapa x temporada)</li>
                    <li>Costo del agua por m³</li>
                    <li>Costo inicial de plantas</li>
                    <li>Horizonte de 4 años</li>
                  </ul>
                </div>
                <div>
                  <div className="font-semibold text-gray-400 mb-1">No incluido:</div>
                  <ul className="space-y-0.5 text-gray-400">
                    <li>Postcosecha (embalaje, transporte, frío)</li>
                    <li>Mano de obra (poda, raleo, cosecha)</li>
                    <li>Fertilizantes y fitosanitarios</li>
                    <li>Inversión sistema de riego (CAPEX)</li>
                    <li>Seguros agrícolas</li>
                    <li>Impuestos y permisos</li>
                    <li>Inflación y tipo de cambio</li>
                    <li>Riesgo climático (heladas, sequía)</li>
                    <li>Degradación del suelo</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
          roi.viable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          ROI {roi.roi_4_años_pct}% (4 años)
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-50 p-2 rounded text-xs">
          <div className="text-gray-500">Inversión plantas</div>
          <div className="font-medium text-gray-900">{formatCLP(roi.costo_plantas)}</div>
          <div className="text-gray-400">{roi.num_plantas} plantas</div>
        </div>
        <div className="bg-gray-50 p-2 rounded text-xs">
          <div className="text-gray-500">Costo agua/año</div>
          <div className="font-medium text-gray-900">{formatCLP(roi.costo_agua_anual)}</div>
        </div>
      </div>

      <div className="bg-gray-50 p-2 rounded text-xs space-y-1">
        <div className="font-medium text-gray-700 mb-1">Producción esperada</div>
        <div className="flex justify-between">
          <span className="text-gray-500">Año 2</span>
          <span className="text-gray-900">{Math.round(roi.kg_año2)} kg → {formatCLP(roi.ingreso_año2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Año 3</span>
          <span className="text-gray-900">{Math.round(roi.kg_año3)} kg → {formatCLP(roi.ingreso_año3)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Año 4</span>
          <span className="font-medium text-gray-900">{Math.round(roi.kg_año4)} kg → {formatCLP(roi.ingreso_año4)}</span>
        </div>
      </div>

      <div className={`p-2 rounded text-xs ${roi.viable ? 'bg-green-50' : 'bg-red-50'}`}>
        <div className="flex justify-between">
          <span className={roi.viable ? 'text-green-700' : 'text-red-700'}>Ingreso neto 4 años</span>
          <span className={`font-bold ${roi.viable ? 'text-green-900' : 'text-red-900'}`}>
            {formatCLP(roi.ingreso_acumulado_4años)}
          </span>
        </div>
        {roi.punto_equilibrio_meses != null && (
          <div className="text-gray-600 mt-1">
            Punto de equilibrio: ~{roi.punto_equilibrio_meses} meses
          </div>
        )}
        <div className="text-gray-500 mt-0.5">
          Precio estimado: {formatCLP(roi.precio_kg_estimado)}/kg
        </div>
      </div>
    </div>
  )
}
