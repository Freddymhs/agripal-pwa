interface TerrenoInfoProps {
  anchoM: number
  altoM: number
  areaM2: number
  areaUsada: number
  areaDisponible: number
}

export function TerrenoInfoOverlay({ anchoM, altoM, areaM2, areaUsada, areaDisponible }: TerrenoInfoProps) {
  return (
    <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-2 rounded shadow text-xs space-y-1">
      <div className="font-bold text-gray-800 border-b pb-1 mb-1">
        Terreno: {anchoM}m x {altoM}m
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-gray-600">Total:</span>
        <span className="font-medium">{areaM2}m2</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-gray-600">Usado:</span>
        <span className="font-medium text-orange-600">{areaUsada}m2</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-gray-600">Libre:</span>
        <span className="font-medium text-green-600">{areaDisponible}m2</span>
      </div>
      <div className="flex items-center gap-2 pt-1 border-t mt-1">
        <div className="w-10 h-0.5 bg-black" />
        <span>1m</span>
      </div>
    </div>
  )
}

interface ModoBadgeProps {
  modo: string
  showSeleccionHint: boolean
}

export function ModoBadge({ modo, showSeleccionHint }: ModoBadgeProps) {
  return (
    <>
      {modo === 'crear_zona' && (
        <div className="absolute top-4 left-4 space-y-2">
          <div className="bg-green-500 text-white px-3 py-1.5 rounded shadow text-sm">
            Modo: Crear Zona
          </div>
        </div>
      )}
      {modo === 'plantar' && (
        <div className="absolute top-4 left-4 bg-lime-500 text-white px-3 py-1.5 rounded shadow text-sm">
          Modo: Plantar
        </div>
      )}
      {showSeleccionHint && (
        <div className="absolute top-4 right-4 bg-gray-700/80 text-white px-2 py-1 rounded text-xs">
          Shift + arrastrar = seleccion multiple
        </div>
      )}
    </>
  )
}
