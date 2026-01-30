interface MapaControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  scale: number
  hasSelection?: boolean
}

export function MapaControls({
  onZoomIn,
  onZoomOut,
  onReset,
  scale,
  hasSelection,
}: MapaControlsProps) {
  return (
    <div className="absolute top-4 right-4 flex flex-col gap-1">
      <button
        onClick={onZoomIn}
        className={`w-8 h-8 rounded shadow flex items-center justify-center text-lg font-bold ${
          hasSelection
            ? 'bg-green-100 hover:bg-green-200 text-green-700'
            : 'bg-white hover:bg-gray-50'
        }`}
        title={hasSelection ? "Zoom In (centrado en zona)" : "Zoom In"}
      >
        +
      </button>
      <button
        onClick={onZoomOut}
        className={`w-8 h-8 rounded shadow flex items-center justify-center text-lg font-bold ${
          hasSelection
            ? 'bg-green-100 hover:bg-green-200 text-green-700'
            : 'bg-white hover:bg-gray-50'
        }`}
        title={hasSelection ? "Zoom Out (centrado en zona)" : "Zoom Out"}
      >
        −
      </button>
      <button
        onClick={onReset}
        className="bg-white w-8 h-8 rounded shadow hover:bg-gray-50 flex items-center justify-center text-xs"
        title="Reset View"
      >
        1:1
      </button>
      <div className="bg-white px-2 py-1 rounded shadow text-xs text-center">
        {Math.round(scale * 100)}%
      </div>
      {hasSelection && (
        <div className="bg-green-500 text-white px-1 py-0.5 rounded shadow text-[10px] text-center">
          🎯 Zona
        </div>
      )}
    </div>
  )
}
