'use client'

import type { Terreno } from '@/types'
import { ChecklistLegal } from './checklist-legal'

interface ResumenTerrenoProps {
  terreno: Terreno
  onConfiguracion?: () => void
}

export function ResumenTerreno({ terreno, onConfiguracion }: ResumenTerrenoProps) {
  const tieneUbicacion = terreno.ubicacion?.region || terreno.ubicacion?.comuna
  const tieneConectividad = terreno.conectividad?.señal_celular !== undefined
  const tieneInfraestructura = terreno.infraestructura?.acceso !== undefined

  const calcularDistanciaPromedio = () => {
    const distancias = terreno.distancias
    if (!distancias) return null
    const valores = [
      distancias.pueblo_cercano_km,
      distancias.ciudad_principal_km,
      distancias.hospital_km,
      distancias.ferreteria_agricola_km,
      distancias.mercado_mayorista_km,
    ].filter((v): v is number => v !== undefined)
    if (valores.length === 0) return null
    return Math.round(valores.reduce((a, b) => a + b, 0) / valores.length)
  }

  const distanciaPromedio = calcularDistanciaPromedio()

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-medium text-gray-900">{terreno.nombre}</h3>
        {onConfiguracion && (
          <button
            onClick={onConfiguracion}
            className="text-sm text-green-600 hover:text-green-700"
          >
            Configurar
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Dimensiones</div>
            <div className="font-medium text-gray-900">
              {terreno.ancho_m}m × {terreno.alto_m}m
            </div>
          </div>
          <div>
            <div className="text-gray-500">Área</div>
            <div className="font-medium text-gray-900">{terreno.area_m2} m²</div>
          </div>
        </div>

        {tieneUbicacion && (
          <div className="text-sm">
            <div className="text-gray-500 mb-1">Ubicación</div>
            <div className="text-gray-900">
              {[terreno.ubicacion?.comuna, terreno.ubicacion?.region]
                .filter(Boolean)
                .join(', ')}
            </div>
            {terreno.ubicacion?.direccion && (
              <div className="text-gray-600 text-xs">{terreno.ubicacion.direccion}</div>
            )}
          </div>
        )}

        <ChecklistLegal legal={terreno.legal} compact />

        {distanciaPromedio !== null && (
          <div className="text-sm">
            <div className="text-gray-500">Distancia promedio servicios</div>
            <div className="font-medium text-gray-900">~{distanciaPromedio} km</div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 text-xs">
          {tieneConectividad && (
            <>
              {terreno.conectividad?.señal_celular && (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                  Señal celular
                </span>
              )}
              {terreno.conectividad?.internet_disponible && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  Internet
                </span>
              )}
            </>
          )}
          {tieneInfraestructura && (
            <>
              {terreno.infraestructura?.electricidad && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                  Electricidad
                </span>
              )}
              {terreno.infraestructura?.agua_potable && (
                <span className="px-2 py-1 bg-cyan-100 text-cyan-700 rounded">
                  Agua potable
                </span>
              )}
            </>
          )}
        </div>

        {terreno.infraestructura?.acceso && (
          <div className="text-sm">
            <div className="text-gray-500">Acceso</div>
            <div className="text-gray-900 capitalize">
              {terreno.infraestructura.acceso.replaceAll('_', ' ')}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
