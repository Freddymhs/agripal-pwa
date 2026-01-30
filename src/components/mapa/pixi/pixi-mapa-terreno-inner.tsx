'use client'

import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { Container, Graphics } from 'pixi.js'
import { usePixiApp } from './use-pixi-app'
import { usePixiViewport } from './use-pixi-viewport'
import { PixiGridLayer } from './pixi-grid-layer'
import { PixiZonasLayer } from './pixi-zonas-layer'
import { PixiTextureFactory } from './pixi-texture-factory'
import { PixiPlantasLayer } from './pixi-plantas-layer'
import { PixiHitTest } from './pixi-hit-test'
import { PixiOverlayLayer } from './pixi-overlay-layer'
import { PIXELS_POR_METRO, COLOR_BORDE_TERRENO } from './pixi-constants'
import { MapaControls } from '../mapa-controls'
import { snapToGrid } from '@/lib/validations/planta'
import type { GridParams } from '@/lib/validations/planta'
import type { Terreno, Zona, Planta } from '@/types'

interface ZonaPreview {
  zonaId: string
  x: number
  y: number
  ancho: number
  alto: number
  esValida: boolean
}

interface MapaTerrenoProps {
  terreno: Terreno
  zonas: Zona[]
  plantas: Planta[]
  zonaSeleccionadaId?: string | null
  zonaPreview?: ZonaPreview | null
  modo?: 'terreno' | 'zonas' | 'plantas' | 'crear_zona' | 'plantar'
  cultivosEspaciado?: Record<string, number>
  cultivosColores?: Record<string, number>
  plantasSeleccionadasIds?: string[]
  gridParams?: GridParams | null
  posicionesOcupadas?: Set<string>
  onZonaClick?: (zona: Zona) => void
  onMapClick?: (x: number, y: number) => void
  onPlantaClick?: (planta: Planta) => void
  onZonaCreada?: (rect: { x: number; y: number; ancho: number; alto: number }) => void
  onSeleccionMultiple?: (plantaIds: string[]) => void
  onMoverPlantasSeleccionadas?: (plantaId: string, deltaX: number, deltaY: number) => Promise<void>
}

interface Point {
  x: number
  y: number
}

const SNAP_THRESHOLD = 0.5

export function PixiMapaTerrenoInner({
  terreno,
  zonas,
  plantas,
  zonaSeleccionadaId,
  zonaPreview,
  modo = 'terreno',
  cultivosEspaciado = {},
  cultivosColores = {},
  plantasSeleccionadasIds = [],
  gridParams = null,
  posicionesOcupadas = new Set<string>(),
  onZonaClick,
  onMapClick,
  onPlantaClick,
  onZonaCreada,
  onSeleccionMultiple,
  onMoverPlantasSeleccionadas,
}: MapaTerrenoProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { app, isReady } = usePixiApp(containerRef)
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

  const wasDraggingRef = useRef(false)
  const pointerDownScreenRef = useRef<Point | null>(null)

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

  const viewport = usePixiViewport(app, worldRef, { minScale: 0.01 })

  const areaUsada = useMemo(() => zonas.reduce((acc, z) => acc + z.area_m2, 0), [zonas])
  const areaDisponible = terreno.area_m2 - areaUsada

  useEffect(() => {
    if (!app) return
    const world = new Container()
    app.stage.addChild(world)
    worldRef.current = world
    return () => {
      app.stage?.removeChild(world)
      world.destroy({ children: true })
      worldRef.current = null
    }
  }, [app])

  const initialFitDoneRef = useRef(false)

  useEffect(() => {
    if (!app || !worldRef.current || initialFitDoneRef.current) return
    const worldW = terreno.ancho_m * PIXELS_POR_METRO
    const worldH = terreno.alto_m * PIXELS_POR_METRO
    viewport.fitView(worldW, worldH)
    initialFitDoneRef.current = true
  }, [app, terreno.ancho_m, terreno.alto_m, viewport])

  useEffect(() => {
    if (!worldRef.current || !app) return

    const border = new Graphics()
    const w = terreno.ancho_m * PIXELS_POR_METRO
    const h = terreno.alto_m * PIXELS_POR_METRO
    border.rect(0, 0, w, h)
    border.stroke({ color: COLOR_BORDE_TERRENO, width: 2 })
    worldRef.current.addChild(border)
    borderRef.current = border

    return () => {
      worldRef.current?.removeChild(border)
      border.destroy()
      borderRef.current = null
    }
  }, [terreno.ancho_m, terreno.alto_m, app])

  useEffect(() => {
    if (!worldRef.current || !app) return

    const grid = new PixiGridLayer()
    grid.build(terreno.ancho_m, terreno.alto_m)
    worldRef.current.addChildAt(grid.container, 0)
    gridLayerRef.current = grid

    const zonasLayer = new PixiZonasLayer()
    worldRef.current.addChild(zonasLayer.container)
    zonasLayerRef.current = zonasLayer

    const hitTest = new PixiHitTest()
    hitTestRef.current = hitTest
    hitTest.rebuild(propsRef.current.plantas, propsRef.current.zonas, propsRef.current.cultivosEspaciado)

    const overlay = new PixiOverlayLayer()
    worldRef.current.addChild(overlay.container)
    overlayLayerRef.current = overlay

    return () => {
      grid.destroy()
      zonasLayer.destroy()
      hitTest.destroy()
      overlay.destroy()
      gridLayerRef.current = null
      zonasLayerRef.current = null
      hitTestRef.current = null
      overlayLayerRef.current = null
    }
  }, [app, terreno.ancho_m, terreno.alto_m])

  useEffect(() => {
    if (!app || !worldRef.current) return

    const factory = new PixiTextureFactory()
    let cancelled = false

    factory.init(app.renderer).then(() => {
      if (cancelled) {
        factory.destroy()
        return
      }
      textureFactoryRef.current = factory

      const layer = new PixiPlantasLayer(factory)
      worldRef.current?.addChild(layer.container)

      if (overlayLayerRef.current) {
        worldRef.current?.removeChild(overlayLayerRef.current.container)
        worldRef.current?.addChild(overlayLayerRef.current.container)
      }

      plantasLayerRef.current = layer
    })

    return () => {
      cancelled = true
      if (plantasLayerRef.current) {
        worldRef.current?.removeChild(plantasLayerRef.current.container)
        plantasLayerRef.current.destroy()
        plantasLayerRef.current = null
      }
      factory.destroy()
      textureFactoryRef.current = null
    }
  }, [app])

  const zonaCultivoColor = useMemo(() => {
    const map: Record<string, number | null> = {}
    for (const zona of zonas) {
      if (zona.tipo !== 'cultivo') continue
      const plantasZona = plantas.filter(p => p.zona_id === zona.id)
      if (plantasZona.length === 0) continue
      const tipos = new Set(plantasZona.map(p => p.tipo_cultivo_id))
      if (tipos.size === 1) {
        const tipoId = [...tipos][0]
        map[zona.id] = cultivosColores[tipoId] ?? null
      }
    }
    return map
  }, [zonas, plantas, cultivosColores])

  useEffect(() => {
    if (!zonasLayerRef.current) return
    const zonasInteractivas = modo === 'zonas' || modo === 'plantar'
    zonasLayerRef.current.build(
      zonas,
      zonaSeleccionadaId || null,
      viewport.getScale(),
      (zona) => propsRef.current.onZonaClick?.(zona),
      zonaCultivoColor,
      zonasInteractivas
    )
  }, [zonas, zonaSeleccionadaId, viewport, zonaCultivoColor, modo])

  useEffect(() => {
    if (!plantasLayerRef.current) return
    const selSet = new Set(plantasSeleccionadasIds)
    plantasLayerRef.current.rebuild(
      plantas,
      zonas,
      cultivosEspaciado,
      cultivosColores,
      selSet,
      viewport.getScale()
    )
  }, [plantas, zonas, cultivosEspaciado, cultivosColores, viewport])

  useEffect(() => {
    if (!plantasLayerRef.current) return
    const selSet = new Set(plantasSeleccionadasIds)
    plantasLayerRef.current.updateSelection(selSet, plantas)
  }, [plantasSeleccionadasIds, plantas])

  useEffect(() => {
    if (!hitTestRef.current) return
    hitTestRef.current.rebuild(plantas, zonas, cultivosEspaciado)
  }, [plantas, zonas, cultivosEspaciado])

  useEffect(() => {
    if (modo !== 'plantar') {
      overlayLayerRef.current?.clearPlantasPreview()
    }
    if (modo !== 'plantas') {
      overlayLayerRef.current?.clearPlantaHover()
    }
  }, [modo, zonaSeleccionadaId])

  useEffect(() => {
    if (!overlayLayerRef.current) return
    if (zonaPreview) {
      overlayLayerRef.current.drawZonaPreview(
        {
          x: zonaPreview.x,
          y: zonaPreview.y,
          ancho: zonaPreview.ancho,
          alto: zonaPreview.alto,
          esValida: zonaPreview.esValida,
        },
        viewport.getScale()
      )
    } else {
      overlayLayerRef.current.clearZonaPreview()
    }
  }, [zonaPreview, viewport])

  useEffect(() => {
    const interval = setInterval(() => {
      setScaleDisplay(viewport.getScale())
    }, 100)
    return () => clearInterval(interval)
  }, [viewport])

  const screenToWorld = useCallback((screenX: number, screenY: number): Point => {
    const scale = viewport.scaleRef.current
    const offset = viewport.offsetRef.current
    return {
      x: (screenX - offset.x) / scale,
      y: (screenY - offset.y) / scale,
    }
  }, [viewport])

  const calcSnapGuides = useCallback((cursorMetros: Point): { verticalX: number | null; horizontalY: number | null } => {
    const t = propsRef.current.terreno
    const z = propsRef.current.zonas
    const edgesX: number[] = [0, t.ancho_m]
    const edgesY: number[] = [0, t.alto_m]

    for (const zona of z) {
      edgesX.push(zona.x, zona.x + zona.ancho)
      edgesY.push(zona.y, zona.y + zona.alto)
    }

    let closestX: number | null = null
    let minDistX = SNAP_THRESHOLD
    for (const edge of edgesX) {
      const dist = Math.abs(cursorMetros.x - edge)
      if (dist < minDistX) {
        minDistX = dist
        closestX = edge
      }
    }

    let closestY: number | null = null
    let minDistY = SNAP_THRESHOLD
    for (const edge of edgesY) {
      const dist = Math.abs(cursorMetros.y - edge)
      if (dist < minDistY) {
        minDistY = dist
        closestY = edge
      }
    }

    return { verticalX: closestX, horizontalY: closestY }
  }, [])

  const snapPosition = useCallback((pos: Point): Point => {
    let { x, y } = pos
    const t = propsRef.current.terreno
    const z = propsRef.current.zonas
    const edgesX: number[] = [0, t.ancho_m]
    const edgesY: number[] = [0, t.alto_m]

    for (const zona of z) {
      edgesX.push(zona.x, zona.x + zona.ancho)
      edgesY.push(zona.y, zona.y + zona.alto)
    }

    for (const edge of edgesX) {
      if (Math.abs(x - edge) < SNAP_THRESHOLD) x = edge
    }
    for (const edge of edgesY) {
      if (Math.abs(y - edge) < SNAP_THRESHOLD) y = edge
    }

    return { x, y }
  }, [])

  useEffect(() => {
    if (!app || !worldRef.current) return

    const canvas = app.canvas as HTMLCanvasElement
    let isDrawing = false
    let drawStart: Point | null = null
    let isSelecting = false
    let selectionStart: Point | null = null
    let isMovingPlants = false
    let dragStartWorld: Point | null = null
    const DRAG_THRESHOLD = 5
    const originalPlantaPositions = new Map<string, Point>()

    const getMousePos = (e: PointerEvent): Point => {
      const rect = canvas.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    const getPlantaSeleccionadaEnPos = (worldPos: Point): Planta | null => {
      const p = propsRef.current
      if (!p.plantasSeleccionadasIds || p.plantasSeleccionadasIds.length === 0) return null

      const metrosX = worldPos.x / PIXELS_POR_METRO
      const metrosY = worldPos.y / PIXELS_POR_METRO

      for (const planta of p.plantas) {
        if (!p.plantasSeleccionadasIds.includes(planta.id)) continue
        const zona = p.zonas.find(z => z.id === planta.zona_id)
        if (!zona) continue

        const absX = zona.x + planta.x
        const absY = zona.y + planta.y
        const espaciado = p.cultivosEspaciado[planta.tipo_cultivo_id] || 0.1
        const radius = espaciado / 2

        const dist = Math.sqrt((metrosX - absX) ** 2 + (metrosY - absY) ** 2)
        if (dist <= radius + 0.2) return planta
      }
      return null
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      const screenPos = getMousePos(e)
      pointerDownScreenRef.current = { x: e.clientX, y: e.clientY }
      wasDraggingRef.current = false
      const worldPos = screenToWorld(screenPos.x, screenPos.y)
      const currentModo = modoRef.current

      if (currentModo === 'crear_zona') {
        const metrosX = worldPos.x / PIXELS_POR_METRO
        const metrosY = worldPos.y / PIXELS_POR_METRO
        const clamped = {
          x: Math.max(0, Math.min(propsRef.current.terreno.ancho_m, metrosX)),
          y: Math.max(0, Math.min(propsRef.current.terreno.alto_m, metrosY)),
        }
        const snapped = snapPosition(clamped)
        drawStart = snapped
        isDrawing = true
        return
      }

      if (currentModo === 'plantas' && e.shiftKey && propsRef.current.onSeleccionMultiple) {
        selectionStart = worldPos
        isSelecting = true
        return
      }

      if (currentModo === 'plantas' && !e.shiftKey) {
        const plantaSel = getPlantaSeleccionadaEnPos(worldPos)
        if (plantaSel) {
          isMovingPlants = true
          dragStartWorld = worldPos
          originalPlantaPositions.clear()
          for (const id of (propsRef.current.plantasSeleccionadasIds || [])) {
            const planta = propsRef.current.plantas.find(p => p.id === id)
            if (planta) {
              originalPlantaPositions.set(id, { x: planta.x, y: planta.y })
            }
          }
          return
        }
      }

      viewport.startPan(e.clientX, e.clientY)
      canvas.style.cursor = 'grabbing'
    }

    const onPointerMove = (e: PointerEvent) => {
      if (pointerDownScreenRef.current) {
        const dx = e.clientX - pointerDownScreenRef.current.x
        const dy = e.clientY - pointerDownScreenRef.current.y
        if (dx * dx + dy * dy > DRAG_THRESHOLD * DRAG_THRESHOLD) {
          wasDraggingRef.current = true
        }
      }

      const screenPos = getMousePos(e)
      const worldPos = screenToWorld(screenPos.x, screenPos.y)
      const currentModo = modoRef.current
      const scale = viewport.scaleRef.current

      if (currentModo === 'crear_zona') {
        const metrosX = worldPos.x / PIXELS_POR_METRO
        const metrosY = worldPos.y / PIXELS_POR_METRO
        const clamped = {
          x: Math.max(0, Math.min(propsRef.current.terreno.ancho_m, metrosX)),
          y: Math.max(0, Math.min(propsRef.current.terreno.alto_m, metrosY)),
        }
        const guides = calcSnapGuides(clamped)
        overlayLayerRef.current?.drawSnapGuides(
          guides.verticalX,
          guides.horizontalY,
          propsRef.current.terreno.ancho_m,
          propsRef.current.terreno.alto_m,
          scale
        )

        if (isDrawing && drawStart) {
          const snapped = snapPosition(clamped)
          const startPx = { x: drawStart.x * PIXELS_POR_METRO, y: drawStart.y * PIXELS_POR_METRO }
          const currentPx = { x: snapped.x * PIXELS_POR_METRO, y: snapped.y * PIXELS_POR_METRO }
          overlayLayerRef.current?.drawCreateZona(startPx, currentPx, scale)
        }
        return
      }

      if (currentModo === 'plantar') {
        const p = propsRef.current
        const gp = p.gridParams
        const zonaSelId = p.zonaSeleccionadaId
        const zona = zonaSelId ? p.zonas.find(z => z.id === zonaSelId) : null

        if (gp && zona && zona.tipo === 'cultivo') {
          const metrosX = worldPos.x / PIXELS_POR_METRO
          const metrosY = worldPos.y / PIXELS_POR_METRO
          const relX = metrosX - zona.x
          const relY = metrosY - zona.y

          if (relX >= 0 && relX <= zona.ancho && relY >= 0 && relY <= zona.alto) {
            const snapped = snapToGrid(relX, relY, gp, p.posicionesOcupadas)
            if (snapped) {
              const absX = zona.x + snapped.x
              const absY = zona.y + snapped.y
              const preview = new Map<string, { x: number; y: number }>()
              preview.set('snap-preview', { x: absX, y: absY })
              const radius = (gp.espaciado / 2) * PIXELS_POR_METRO
              overlayLayerRef.current?.drawPlantasPreview(preview, scale, radius)
            } else {
              overlayLayerRef.current?.clearPlantasPreview()
            }
          } else {
            overlayLayerRef.current?.clearPlantasPreview()
          }
        } else {
          overlayLayerRef.current?.clearPlantasPreview()
        }
      }

      if (isSelecting && selectionStart) {
        overlayLayerRef.current?.drawSelectionRect(selectionStart, worldPos, scale)
        return
      }

      if (isMovingPlants && dragStartWorld) {
        const deltaX = (worldPos.x - dragStartWorld.x) / PIXELS_POR_METRO
        const deltaY = (worldPos.y - dragStartWorld.y) / PIXELS_POR_METRO
        const t = propsRef.current.terreno

        const preview = new Map<string, { x: number; y: number }>()
        for (const [id, origPos] of originalPlantaPositions) {
          const planta = propsRef.current.plantas.find(p => p.id === id)
          if (!planta) continue
          const zona = propsRef.current.zonas.find(z => z.id === planta.zona_id)
          if (!zona) continue

          preview.set(id, {
            x: Math.max(0, Math.min(t.ancho_m, zona.x + origPos.x + deltaX)),
            y: Math.max(0, Math.min(t.alto_m, zona.y + origPos.y + deltaY)),
          })
        }
        overlayLayerRef.current?.drawPlantasPreview(preview, scale)
        return
      }

      if (viewport.isPanningRef.current) {
        viewport.movePan(e.clientX, e.clientY)
        return
      }

      if (currentModo === 'plantas') {
        if (!hitTestRef.current) {
          console.warn('[PixiMapa] hitTestRef is null in plantas mode')
          return
        }
        const planta = hitTestRef.current.hitTestPoint(worldPos.x, worldPos.y)
        canvas.style.cursor = planta ? 'pointer' : 'grab'
        if (planta) {
          const zona = propsRef.current.zonas.find(z => z.id === planta.zona_id)
          if (zona) {
            const absX = (zona.x + planta.x) * PIXELS_POR_METRO
            const absY = (zona.y + planta.y) * PIXELS_POR_METRO
            const espaciado = propsRef.current.cultivosEspaciado[planta.tipo_cultivo_id] || 3
            const radius = (espaciado / 2) * PIXELS_POR_METRO
            overlayLayerRef.current?.drawPlantaHover(absX, absY, radius, scale)
          }
        } else {
          overlayLayerRef.current?.clearPlantaHover()
        }
      } else {
        canvas.style.cursor = 'grab'
        overlayLayerRef.current?.clearPlantaHover()
      }
    }

    const onPointerUp = async (e: PointerEvent) => {
      const screenPos = getMousePos(e)
      const worldPos = screenToWorld(screenPos.x, screenPos.y)
      const currentModo = modoRef.current
      const p = propsRef.current

      if (currentModo === 'crear_zona' && isDrawing && drawStart) {
        const metrosX = worldPos.x / PIXELS_POR_METRO
        const metrosY = worldPos.y / PIXELS_POR_METRO
        const clamped = {
          x: Math.max(0, Math.min(p.terreno.ancho_m, metrosX)),
          y: Math.max(0, Math.min(p.terreno.alto_m, metrosY)),
        }
        const snapped = snapPosition(clamped)

        const rect = {
          x: Math.round(Math.min(drawStart.x, snapped.x) * 2) / 2,
          y: Math.round(Math.min(drawStart.y, snapped.y) * 2) / 2,
          ancho: Math.round(Math.abs(snapped.x - drawStart.x) * 2) / 2,
          alto: Math.round(Math.abs(snapped.y - drawStart.y) * 2) / 2,
        }

        if (rect.ancho >= 1 && rect.alto >= 1) {
          p.onZonaCreada?.(rect)
        }

        isDrawing = false
        drawStart = null
        overlayLayerRef.current?.clearCreateZona()
        overlayLayerRef.current?.clearSnapGuides()
        return
      }

      if (isSelecting && selectionStart) {
        const minX = Math.min(selectionStart.x, worldPos.x) / PIXELS_POR_METRO
        const maxX = Math.max(selectionStart.x, worldPos.x) / PIXELS_POR_METRO
        const minY = Math.min(selectionStart.y, worldPos.y) / PIXELS_POR_METRO
        const maxY = Math.max(selectionStart.y, worldPos.y) / PIXELS_POR_METRO

        const plantasEnRect = p.plantas.filter(planta => {
          const zona = p.zonas.find(z => z.id === planta.zona_id)
          if (!zona) return false
          const absX = zona.x + planta.x
          const absY = zona.y + planta.y
          return absX >= minX && absX <= maxX && absY >= minY && absY <= maxY
        })

        if (plantasEnRect.length > 0) {
          p.onSeleccionMultiple?.(plantasEnRect.map(pl => pl.id))
        }

        isSelecting = false
        selectionStart = null
        overlayLayerRef.current?.clearSelectionRect()
        return
      }

      if (isMovingPlants && dragStartWorld && p.onMoverPlantasSeleccionadas) {
        const deltaX = (worldPos.x - dragStartWorld.x) / PIXELS_POR_METRO
        const deltaY = (worldPos.y - dragStartWorld.y) / PIXELS_POR_METRO

        if (Math.abs(deltaX) > 0.01 || Math.abs(deltaY) > 0.01) {
          for (const plantaId of (p.plantasSeleccionadasIds || [])) {
            await p.onMoverPlantasSeleccionadas(plantaId, deltaX, deltaY)
          }
        }

        isMovingPlants = false
        dragStartWorld = null
        originalPlantaPositions.clear()
        overlayLayerRef.current?.clearPlantasPreview()
        return
      }

      if (viewport.isPanningRef.current) {
        viewport.endPan()
        canvas.style.cursor = 'grab'
      }
    }

    const onPointerLeave = () => {
      if (isDrawing) {
        isDrawing = false
        drawStart = null
        overlayLayerRef.current?.clearCreateZona()
        overlayLayerRef.current?.clearSnapGuides()
      }
      if (isSelecting) {
        isSelecting = false
        selectionStart = null
        overlayLayerRef.current?.clearSelectionRect()
      }
      if (isMovingPlants) {
        isMovingPlants = false
        dragStartWorld = null
        originalPlantaPositions.clear()
        overlayLayerRef.current?.clearPlantasPreview()
      }
      if (modoRef.current === 'plantar') {
        overlayLayerRef.current?.clearPlantasPreview()
      }
      overlayLayerRef.current?.clearPlantaHover()
      viewport.endPan()
    }

    const onPointerTap = (e: MouseEvent) => {
      if (wasDraggingRef.current) {
        wasDraggingRef.current = false
        pointerDownScreenRef.current = null
        return
      }
      pointerDownScreenRef.current = null

      const rect = canvas.getBoundingClientRect()
      const screenPos = { x: e.clientX - rect.left, y: e.clientY - rect.top }
      const worldPos = screenToWorld(screenPos.x, screenPos.y)
      const currentModo = modoRef.current
      const p = propsRef.current

      if (currentModo === 'plantar' && p.onMapClick) {
        const metrosX = worldPos.x / PIXELS_POR_METRO
        const metrosY = worldPos.y / PIXELS_POR_METRO
        const gp = p.gridParams
        const zonaSelId = p.zonaSeleccionadaId
        const zona = zonaSelId ? p.zonas.find(z => z.id === zonaSelId) : null

        if (gp && zona && zona.tipo === 'cultivo') {
          const relX = metrosX - zona.x
          const relY = metrosY - zona.y
          if (relX >= 0 && relX <= zona.ancho && relY >= 0 && relY <= zona.alto) {
            const snapped = snapToGrid(relX, relY, gp, p.posicionesOcupadas)
            if (snapped) {
              p.onMapClick(zona.x + snapped.x, zona.y + snapped.y)
            } else {
              p.onMapClick(metrosX, metrosY)
            }
          } else {
            p.onMapClick(metrosX, metrosY)
          }
        } else {
          p.onMapClick(metrosX, metrosY)
        }
        return
      }

      if (currentModo === 'plantas') {
        const planta = hitTestRef.current?.hitTestPoint(worldPos.x, worldPos.y)
        if (planta) {
          p.onPlantaClick?.(planta)
        }
      }
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointerleave', onPointerLeave)
    canvas.addEventListener('click', onPointerTap)

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointerleave', onPointerLeave)
      canvas.removeEventListener('click', onPointerTap)
    }
  }, [app, screenToWorld, viewport, calcSnapGuides, snapPosition])

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

      <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-2 rounded shadow text-xs space-y-1">
        <div className="font-bold text-gray-800 border-b pb-1 mb-1">
          Terreno: {terreno.ancho_m}m x {terreno.alto_m}m
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-600">Total:</span>
          <span className="font-medium">{terreno.area_m2}m2</span>
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

      {modo === 'plantas' && onSeleccionMultiple && (
        <div className="absolute top-4 right-4 bg-gray-700/80 text-white px-2 py-1 rounded text-xs">
          Shift + arrastrar = seleccion multiple
        </div>
      )}
    </div>
  )
}
