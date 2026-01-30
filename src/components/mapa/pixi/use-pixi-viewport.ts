'use client'

import { useEffect, useRef, useCallback, type RefObject } from 'react'
import { Application, Container } from 'pixi.js'
import { MIN_SCALE, MAX_SCALE } from './pixi-constants'

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function usePixiViewport(
  app: Application | null,
  worldContainerRef: RefObject<Container | null>,
  options?: { minScale?: number; maxScale?: number }
): {
  scaleRef: React.MutableRefObject<number>
  offsetRef: React.MutableRefObject<{ x: number; y: number }>
  isPanningRef: React.MutableRefObject<boolean>
  startPan: (clientX: number, clientY: number) => void
  movePan: (clientX: number, clientY: number) => void
  endPan: () => void
  zoomIn: () => void
  zoomOut: () => void
  resetView: () => void
  fitView: (worldWidthPx: number, worldHeightPx: number) => void
  getScale: () => number
  applyTransform: () => void
} {
  const minScale = options?.minScale ?? MIN_SCALE
  const maxScale = options?.maxScale ?? MAX_SCALE
  const scaleRef = useRef(1)
  const offsetRef = useRef({ x: 0, y: 0 })
  const isPanningRef = useRef(false)
  const lastPosRef = useRef({ x: 0, y: 0 })

  const applyTransform = useCallback(() => {
    const wc = worldContainerRef.current
    if (!wc) return
    wc.position.set(offsetRef.current.x, offsetRef.current.y)
    wc.scale.set(scaleRef.current)
  }, [worldContainerRef])

  useEffect(() => {
    if (!app) return

    const canvas = app.canvas as HTMLCanvasElement

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()

      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const oldScale = scaleRef.current
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      const newScale = clamp(oldScale + delta * oldScale, minScale, maxScale)

      const worldX = (mouseX - offsetRef.current.x) / oldScale
      const worldY = (mouseY - offsetRef.current.y) / oldScale

      offsetRef.current.x = mouseX - worldX * newScale
      offsetRef.current.y = mouseY - worldY * newScale
      scaleRef.current = newScale

      applyTransform()
    }

    canvas.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      canvas.removeEventListener('wheel', onWheel)
    }
  }, [app, minScale, maxScale, applyTransform])

  const startPan = useCallback((clientX: number, clientY: number) => {
    isPanningRef.current = true
    lastPosRef.current = { x: clientX, y: clientY }
  }, [])

  const movePan = useCallback((clientX: number, clientY: number) => {
    if (!isPanningRef.current) return

    const dx = clientX - lastPosRef.current.x
    const dy = clientY - lastPosRef.current.y

    offsetRef.current.x += dx
    offsetRef.current.y += dy
    lastPosRef.current = { x: clientX, y: clientY }

    applyTransform()
  }, [applyTransform])

  const endPan = useCallback(() => {
    isPanningRef.current = false
  }, [])

  const zoomIn = useCallback(() => {
    if (!app) return
    const canvas = app.canvas as HTMLCanvasElement
    const centerX = canvas.width / (2 * (window.devicePixelRatio || 1))
    const centerY = canvas.height / (2 * (window.devicePixelRatio || 1))

    const oldScale = scaleRef.current
    const newScale = clamp(oldScale + 0.5, minScale, maxScale)

    const worldX = (centerX - offsetRef.current.x) / oldScale
    const worldY = (centerY - offsetRef.current.y) / oldScale

    offsetRef.current.x = centerX - worldX * newScale
    offsetRef.current.y = centerY - worldY * newScale
    scaleRef.current = newScale

    applyTransform()
  }, [app, minScale, maxScale, applyTransform])

  const zoomOut = useCallback(() => {
    if (!app) return
    const canvas = app.canvas as HTMLCanvasElement
    const centerX = canvas.width / (2 * (window.devicePixelRatio || 1))
    const centerY = canvas.height / (2 * (window.devicePixelRatio || 1))

    const oldScale = scaleRef.current
    const newScale = clamp(oldScale - 0.5, minScale, maxScale)

    const worldX = (centerX - offsetRef.current.x) / oldScale
    const worldY = (centerY - offsetRef.current.y) / oldScale

    offsetRef.current.x = centerX - worldX * newScale
    offsetRef.current.y = centerY - worldY * newScale
    scaleRef.current = newScale

    applyTransform()
  }, [app, minScale, maxScale, applyTransform])

  const fitView = useCallback((worldWidthPx: number, worldHeightPx: number) => {
    if (!app) return
    const canvas = app.canvas as HTMLCanvasElement
    const dpr = window.devicePixelRatio || 1
    const canvasW = canvas.width / dpr
    const canvasH = canvas.height / dpr

    const padding = 40
    const scaleX = (canvasW - padding * 2) / worldWidthPx
    const scaleY = (canvasH - padding * 2) / worldHeightPx
    const newScale = clamp(Math.min(scaleX, scaleY), minScale, maxScale)

    const offsetX = (canvasW - worldWidthPx * newScale) / 2
    const offsetY = (canvasH - worldHeightPx * newScale) / 2

    scaleRef.current = newScale
    offsetRef.current = { x: offsetX, y: offsetY }
    applyTransform()
  }, [app, minScale, maxScale, applyTransform])

  const resetView = useCallback(() => {
    scaleRef.current = 1
    offsetRef.current = { x: 0, y: 0 }
    applyTransform()
  }, [applyTransform])

  const getScale = useCallback(() => scaleRef.current, [])

  return {
    scaleRef,
    offsetRef,
    isPanningRef,
    startPan,
    movePan,
    endPan,
    zoomIn,
    zoomOut,
    resetView,
    fitView,
    getScale,
    applyTransform,
  }
}
