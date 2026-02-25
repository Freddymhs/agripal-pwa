'use client'

import { useState } from 'react'
import { obtenerVariedades, type VariedadCultivo } from '@/lib/data/variedades'
import { obtenerMercado, type DatosMercado } from '@/lib/data/mercado'
import type { CatalogoCultivo, UUID } from '@/types'
import { formatCLP } from '@/lib/utils'

interface CatalogoListProps {
  cultivos: CatalogoCultivo[]
  onEditar: (cultivo: CatalogoCultivo) => void
  onEliminar: (id: UUID) => void
}

export function CatalogoList({ cultivos, onEditar, onEliminar }: CatalogoListProps) {
  if (cultivos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay cultivos en el catálogo. Agrega uno para empezar.
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cultivos.map((cultivo) => (
        <CultivoCard
          key={cultivo.id}
          cultivo={cultivo}
          onEditar={() => onEditar(cultivo)}
          onEliminar={() => onEliminar(cultivo.id)}
        />
      ))}
    </div>
  )
}

const TENDENCIA_ICONS: Record<string, string> = { alza: '↑', estable: '→', baja: '↓' }
const TENDENCIA_COLORS: Record<string, string> = {
  alza: 'text-green-600',
  estable: 'text-gray-600',
  baja: 'text-red-600',
}

function CultivoCard({
  cultivo,
  onEditar,
  onEliminar,
}: {
  cultivo: CatalogoCultivo
  onEditar: () => void
  onEliminar: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const variedades = obtenerVariedades(cultivo.id)
  const mercado = obtenerMercado(cultivo.id)

  const tierColors = {
    1: 'bg-green-100 text-green-800',
    2: 'bg-yellow-100 text-yellow-800',
    3: 'bg-red-100 text-red-800',
  }

  const riesgoColors = {
    bajo: 'bg-green-100 text-green-800',
    medio: 'bg-yellow-100 text-yellow-800',
    alto: 'bg-red-100 text-red-800',
  }

  return (
    <div className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-bold">{cultivo.nombre}</h3>
          {cultivo.nombre_cientifico && (
            <p className="text-sm text-gray-500 italic">{cultivo.nombre_cientifico}</p>
          )}
        </div>
        <div className="flex gap-1">
          <span className={`text-xs px-2 py-1 rounded ${tierColors[cultivo.tier]}`}>
            Tier {cultivo.tier}
          </span>
          <span className={`text-xs px-2 py-1 rounded ${riesgoColors[cultivo.riesgo]}`}>
            {cultivo.riesgo}
          </span>
        </div>
      </div>

      <div className="space-y-1 text-sm text-gray-600 mb-3">
        <div>
          <span className="font-medium">Agua:</span>{' '}
          {cultivo.agua_m3_ha_año_min}-{cultivo.agua_m3_ha_año_max} m³/ha/año
        </div>
        <div>
          <span className="font-medium">Espaciado:</span>{' '}
          {cultivo.espaciado_recomendado_m}m (mín: {cultivo.espaciado_min_m}m)
        </div>
        <div>
          <span className="font-medium">Producción:</span>{' '}
          {cultivo.tiempo_produccion_meses} meses
        </div>
        {cultivo.precio_kg_min_clp && cultivo.precio_kg_max_clp && (
          <div>
            <span className="font-medium">Precio:</span>{' '}
            {formatCLP(cultivo.precio_kg_min_clp)}-{formatCLP(cultivo.precio_kg_max_clp)}/kg
          </div>
        )}
        {cultivo.clima && (
          <div className="text-xs text-gray-500 mt-1 border-t pt-1">
            {cultivo.clima.temp_min_c !== undefined && cultivo.clima.temp_max_c !== undefined && (
              <span>🌡️ {cultivo.clima.temp_min_c}° a {cultivo.clima.temp_max_c}°C</span>
            )}
            {cultivo.clima.tolerancia_heladas && (
              <span className="ml-2">❄️ {cultivo.clima.tolerancia_heladas}</span>
            )}
          </div>
        )}
      </div>

      {(variedades.length > 0 || mercado) && (
        <div className="mb-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {expanded ? '▾ Ocultar detalles' : '▸ Variedades y mercado'}
          </button>

          {expanded && (
            <div className="mt-2 space-y-2">
              {mercado && (
                <div className="bg-blue-50 p-2 rounded text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-blue-900">Mercado</span>
                    <span className={`font-bold ${TENDENCIA_COLORS[mercado.tendencia]}`}>
                      {TENDENCIA_ICONS[mercado.tendencia]} {mercado.tendencia}
                    </span>
                  </div>
                  <div className="text-blue-800">
                    {formatCLP(mercado.precio_kg_actual_clp)}/kg actual
                  </div>
                  <div className="text-blue-700">
                    Demanda: {mercado.demanda_local} | Competencia: {mercado.competencia_local}
                    {mercado.mercado_exportacion && ' | Exportable'}
                  </div>
                  {mercado.notas && (
                    <p className="text-blue-600 mt-1 italic">{mercado.notas}</p>
                  )}
                </div>
              )}

              {variedades.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-gray-700">Variedades:</span>
                  {variedades.map(v => (
                    <div key={v.id} className="bg-gray-50 p-2 rounded text-xs">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-900">{v.nombre}</span>
                        <span className="text-gray-500">{formatCLP(v.precio_planta_clp)}/planta</span>
                      </div>
                      <div className="text-gray-500">{v.origen} | Rend: x{v.rendimiento_relativo}</div>
                      <div className="text-green-600 mt-0.5">+ {v.ventajas.join(', ')}</div>
                      <div className="text-red-500">- {v.desventajas.join(', ')}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onEditar}
          className="flex-1 text-sm bg-gray-100 py-1 rounded hover:bg-gray-200"
        >
          Editar
        </button>
        <button
          onClick={onEliminar}
          className="text-sm text-red-600 hover:text-red-800 px-3"
        >
          Eliminar
        </button>
      </div>
    </div>
  )
}
