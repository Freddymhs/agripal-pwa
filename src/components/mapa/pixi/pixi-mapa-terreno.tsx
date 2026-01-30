import dynamic from 'next/dynamic'

const PixiMapaTerrenoInner = dynamic(
  () => import('./pixi-mapa-terreno-inner').then(m => ({ default: m.PixiMapaTerrenoInner })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-green-50 flex items-center justify-center">
        <span className="text-gray-400">Cargando mapa...</span>
      </div>
    ),
  }
)

export { PixiMapaTerrenoInner as PixiMapaTerreno }
