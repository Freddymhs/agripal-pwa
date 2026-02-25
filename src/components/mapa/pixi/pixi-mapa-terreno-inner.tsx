'use client'

import { useRef, useState, useCallback, useMemo } from 'react'
import { Container, type Graphics } from 'pixi.js'
import { usePixiApp } from './use-pixi-app'
import { usePixiViewport } from './use-pixi-viewport'
import { useMapLayers } from './use-map-layers'
import { useMapInteractions } from './use-map-interactions'
import { useMapSnap } from './use-map-snap'
import { PixiGridLayer } from './pixi-grid-layer'
import { PixiZonasLayer } from './pixi-zonas-layer'
import { PixiTextureFactory } from './pixi-texture-factory'
import { PixiPlantasLayer } from './pixi-plantas-layer'
import { PixiHitTest } from './pixi-hit-test'
import { PixiOverlayLayer } from './pixi-overlay-layer'
import { PIXELS_POR_METRO } from './pixi-constants'
import { MapaControls } from '../mapa-controls'
import { TerrenoInfoOverlay, ModoBadge } from './pixi-mapa-info-overlay'
import type { MapaTerrenoProps } from './pixi-map-types'
import { EMPTY_SET, EMPTY_RECORD_NUMBER, EMPTY_RECORD_STRING, EMPTY_STRING_ARRAY } from './pixi-map-types'

export function PixiMapaTerrenoInner({
  terreno,
  zonas,
  plantas,
  zonaSeleccionadaId,
  zonaPreview,
  modo = 'terreno',
  cultivosEspaciado = EMPTY_RECORD_NUMBER,
  cultivosColores = EMPTY_RECORD_STRING,
  plantasSeleccionadasIds = EMPTY_STRING_ARRAY,
  gridParams = null,
  posicionesOcupadas = EMPTY_SET,
  onZonaClick,
  onMapClick,
  onPlantaClick,
  onZonaCreada,
  onSeleccionMultiple,
  onMoverPlantasSeleccionadas,
}: MapaTerrenoProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { app } = usePixiApp(containerRef)
  const worldRef = useRef<Container | null>(null)
  const borderRef = useRef<Graphics | null>(null)

  const gridLayerRef = useRef<PixiGridLayer | null>(null)
  const zonasLayerRef = useRef<PixiZonasLayer | null>(null)
  const textureFactoryRef = useRef<PixiTextureFactory | null>(null)
  const plantasLayerRef = useRef<PixiPlantasLayer | null>(null)
  const hitTestRef = useRef<PixiHitTest | null>(null)
  const overlayLayerRef = useRef<PixiOverlayLayer | null>(null)

  const [scaleDisplay, setScaleDisplay] = useState(1)

  const modoRef = useRef(modo)
  modoRef.current = modo

  const propsRef = useRef({
    zonas, plantas, zonaSeleccionadaId, cultivosEspaciado, cultivosColores,
    plantasSeleccionadasIds, onZonaClick, onMapClick, onPlantaClick,
    onZonaCreada, onSeleccionMultiple, onMoverPlantasSeleccionadas,
    terreno, zonaPreview, gridParams, posicionesOcupadas,
  })
  propsRef.current = {
    zonas, plantas, zonaSeleccionadaId, cultivosEspaciado, cultivosColores,
    plantasSeleccionadasIds, onZonaClick, onMapClick, onPlantaClick,
    onZonaCreada, onSeleccionMultiple, onMoverPlantasSeleccionadas,
    terreno, zonaPreview, gridParams, posicionesOcupadas,
  }

  const handleScaleChange = useCallback((scale: number) => {
    setScaleDisplay(scale)
  }, [])

  const viewport = usePixiViewport(app, worldRef, { minScale: 0.01, onScaleChange: handleScaleChange })

  const layerRefs = useMemo(() => ({
    worldRef, gridLayerRef, zonasLayerRef, textureFactoryRef,
    plantasLayerRef, hitTestRef, overlayLayerRef, borderRef,
  }), [])

  const layerProps = useMemo(() => ({
    terreno, zonas, plantas, zonaSeleccionadaId,
    cultivosEspaciado, cultivosColores, plantasSeleccionadasIds,
    modo, zonaPreview, onZonaClick,
  }), [terreno, zonas, plantas, zonaSeleccionadaId, cultivosEspaciado, cultivosColores, plantasSeleccionadasIds, modo, zonaPreview, onZonaClick])

  useMapLayers(app, layerRefs, layerProps, propsRef, viewport)

  const { calcSnapGuides, snapPosition } = useMapSnap(propsRef)

  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    const scale = viewport.scaleRef.current
    const offset = viewport.offsetRef.current
    return {
      x: (screenX - offset.x) / scale,
      y: (screenY - offset.y) / scale,
    }
  }, [viewport])

  useMapInteractions({
    app,
    modoRef,
    propsRef,
    hitTestRef,
    overlayLayerRef,
    screenToWorld,
    viewport,
    calcSnapGuides,
    snapPosition,
  })

  const areaUsada = useMemo(() => zonas.reduce((acc, z) => acc + z.area_m2, 0), [zonas])
  const areaDisponible = terreno.area_m2 - areaUsada

  const cursorClass = useMemo(() => {
    if (modo === 'crear_zona') return 'cursor-crosshair'
    if (modo === 'plantar') return 'cursor-cell'
    return 'cursor-grab'
  }, [modo])

  const zoomTowardZona = useCallback((direction: 1 | -1) => {
    const zonaSeleccionada = zonas.find(z => z.id === zonaSeleccionadaId)
    if (!zonaSeleccionada || !app) {
      direction === 1 ? viewport.zoomIn() : viewport.zoomOut()
      return
    }

    const canvas = app.canvas as HTMLCanvasElement
    const centerX = (zonaSeleccionada.x + zonaSeleccionada.ancho / 2) * PIXELS_POR_METRO
    const centerY = (zonaSeleccionada.y + zonaSeleccionada.alto / 2) * PIXELS_POR_METRO
    const canvasCenter = {
      x: canvas.width / (2 * (window.devicePixelRatio || 1)),
      y: canvas.height / (2 * (window.devicePixelRatio || 1)),
    }

    const oldScale = viewport.scaleRef.current
    const step = 0.5 * direction
    const newScale = direction === 1
      ? Math.min(20, oldScale + step)
      : Math.max(0.01, oldScale + step)

    viewport.offsetRef.current.x = canvasCenter.x - centerX * newScale
    viewport.offsetRef.current.y = canvasCenter.y - centerY * newScale
    viewport.scaleRef.current = newScale

    if (worldRef.current) {
      worldRef.current.position.set(viewport.offsetRef.current.x, viewport.offsetRef.current.y)
      worldRef.current.scale.set(newScale)
    }

    setScaleDisplay(newScale)
  }, [zonas, zonaSeleccionadaId, app, viewport])

  return (
    <div className="relative w-full h-full bg-gray-100 overflow-hidden">
      <div ref={containerRef} className={`w-full h-full ${cursorClass}`} />

      <MapaControls
        onZoomIn={() => zoomTowardZona(1)}
        onZoomOut={() => zoomTowardZona(-1)}
        onReset={() => {
          const worldW = terreno.ancho_m * PIXELS_POR_METRO
          const worldH = terreno.alto_m * PIXELS_POR_METRO
          viewport.fitView(worldW, worldH)
        }}
        scale={scaleDisplay}
        hasSelection={!!zonaSeleccionadaId}
      />

      <TerrenoInfoOverlay
        anchoM={terreno.ancho_m}
        altoM={terreno.alto_m}
        areaM2={terreno.area_m2}
        areaUsada={areaUsada}
        areaDisponible={areaDisponible}
      />
      <ModoBadge modo={modo} showSeleccionHint={modo === 'plantas' && !!onSeleccionMultiple} />
    </div>
  )
}
