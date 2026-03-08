# FASE 2: Mapa SVG Interactivo

**Status**: ✅ COMPLETADO
**Prioridad**: 🔴 Alta
**Dependencias**: FASE_1
**Estimación**: 5-6 horas

---

## Objetivo

Crear componente de mapa interactivo usando SVG puro con zoom, pan y renderizado de terreno/zonas.

**IMPORTANTE**: Usamos SVG, NO Leaflet. Leaflet es demasiado complejo para este caso.

---

## Funcionalidades Implementadas (adicionales al plan original)

### Panel de Información del Terreno

- Muestra dimensiones totales del terreno (ancho × alto)
- Muestra área total, área usada y área disponible
- Colores diferenciados (naranja para usado, verde para disponible)
- Incluye escala de referencia (1m)

---

## Tareas

### Tarea 1: Crear Sistema de Coordenadas

**Archivo**: `src/lib/utils/coordinates.ts` (crear)

```typescript
// Escala: 1 metro = 10 píxeles
export const PIXELS_POR_METRO = 10;

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

export function metrosToPixels(metros: number): number {
  return metros * PIXELS_POR_METRO;
}

export function pixelsToMetros(pixels: number): number {
  return pixels / PIXELS_POR_METRO;
}

export function pointToPixels(point: Point): Point {
  return {
    x: metrosToPixels(point.x),
    y: metrosToPixels(point.y),
  };
}

export function pointToMetros(point: Point): Point {
  return {
    x: pixelsToMetros(point.x),
    y: pixelsToMetros(point.y),
  };
}

export function rectToPixels(rect: Rect): Rect {
  return {
    x: metrosToPixels(rect.x),
    y: metrosToPixels(rect.y),
    ancho: metrosToPixels(rect.ancho),
    alto: metrosToPixels(rect.alto),
  };
}

// Verificar si un punto está dentro de un rectángulo
export function isPointInRect(point: Point, rect: Rect): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.ancho &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.alto
  );
}

// Snap a grid (opcional, para alineación)
export function snapToGrid(value: number, gridSize = 0.5): number {
  return Math.round(value / gridSize) * gridSize;
}
```

---

### Tarea 2: Crear Hook useMapControls

**Archivo**: `src/hooks/useMapControls.ts` (crear)

```typescript
"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import type { Point } from "@/lib/utils/coordinates";

interface UseMapControls {
  scale: number;
  offset: Point;
  isPanning: boolean;

  // Event handlers para el SVG
  handleWheel: (e: WheelEvent) => void;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: () => void;
  handleMouseLeave: () => void;

  // Acciones
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;

  // Transform string para SVG
  getTransform: () => string;
}

export function useMapControls(
  minScale = 0.5,
  maxScale = 3,
  initialScale = 1,
): UseMapControls {
  const [scale, setScale] = useState(initialScale);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastPosRef = useRef<Point>({ x: 0, y: 0 });

  // Zoom con rueda del mouse
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setScale((s) => Math.max(minScale, Math.min(maxScale, s + delta)));
    },
    [minScale, maxScale],
  );

  // Pan con mouse
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      // Solo click izquierdo
      setIsPanning(true);
      lastPosRef.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;

      const dx = e.clientX - lastPosRef.current.x;
      const dy = e.clientY - lastPosRef.current.y;

      setOffset((prev) => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }));

      lastPosRef.current = { x: e.clientX, y: e.clientY };
    },
    [isPanning],
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Acciones de zoom
  const zoomIn = useCallback(() => {
    setScale((s) => Math.min(maxScale, s + 0.2));
  }, [maxScale]);

  const zoomOut = useCallback(() => {
    setScale((s) => Math.max(minScale, s - 0.2));
  }, [minScale]);

  const resetView = useCallback(() => {
    setScale(initialScale);
    setOffset({ x: 0, y: 0 });
  }, [initialScale]);

  // Transform string para aplicar al grupo SVG
  const getTransform = useCallback(() => {
    return `translate(${offset.x}, ${offset.y}) scale(${scale})`;
  }, [offset, scale]);

  return {
    scale,
    offset,
    isPanning,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    zoomIn,
    zoomOut,
    resetView,
    getTransform,
  };
}
```

---

### Tarea 3: Crear Componente MapaTerreno

**Archivo**: `src/components/mapa/MapaTerreno.tsx` (crear)

> ⚠️ **NOTA CRÍTICA - Conversión de Coordenadas**
>
> El SVG usa `viewBox` que el navegador escala automáticamente para llenar el contenedor.
> Por defecto (`preserveAspectRatio="xMidYMid meet"`), el contenido se centra y puede haber espacio vacío.
>
> **INCORRECTO** (no funciona):
>
> ```typescript
> const x = (e.clientX - rect.left) / scale - offset.x;
> ```
>
> **CORRECTO** (usar siempre):
>
> ```typescript
> const pt = svg.createSVGPoint();
> pt.x = e.clientX;
> pt.y = e.clientY;
> const svgPoint = pt.matrixTransform(svg.getScreenCTM()?.inverse());
> ```
>
> `getScreenCTM().inverse()` maneja automáticamente el escalado del viewBox al tamaño real del elemento.

```typescript
'use client'

import { useRef, useEffect, useCallback, useMemo } from 'react'
import { useMapControls } from '@/hooks/useMapControls'
import { PIXELS_POR_METRO, pixelsToMetros } from '@/lib/utils/coordinates'
import { ZonaRect } from './ZonaRect'
import { PlantaMarker } from './PlantaMarker'
import { MapaControls } from './MapaControls'
import { MapaGrid } from './MapaGrid'
import type { Terreno, Zona, Planta } from '@/types'

interface MapaTerrenoProps {
  terreno: Terreno
  zonas: Zona[]
  plantas: Planta[]
  zonaSeleccionadaId?: string | null
  modo?: 'ver' | 'crear_zona' | 'crear_planta'
  onZonaClick?: (zona: Zona) => void
  onMapClick?: (x: number, y: number) => void
  onZonaCreada?: (rect: { x: number; y: number; ancho: number; alto: number }) => void
}

export function MapaTerreno({
  terreno,
  zonas,
  plantas,
  zonaSeleccionadaId,
  modo = 'ver',
  onZonaClick,
  onMapClick,
  onZonaCreada,
}: MapaTerrenoProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const controls = useMapControls()

  // Dimensiones en píxeles
  const viewBox = useMemo(() => ({
    width: terreno.ancho_m * PIXELS_POR_METRO,
    height: terreno.alto_m * PIXELS_POR_METRO,
  }), [terreno.ancho_m, terreno.alto_m])

  // Registrar evento wheel
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    svg.addEventListener('wheel', controls.handleWheel, { passive: false })
    return () => svg.removeEventListener('wheel', controls.handleWheel)
  }, [controls.handleWheel])

  // IMPORTANTE: Convertir coordenadas de pantalla a SVG viewBox
  // Usar getScreenCTM() para manejar correctamente el escalado del viewBox
  const getMousePosition = useCallback((e: React.MouseEvent<SVGSVGElement>): { x: number; y: number } | null => {
    if (!svgRef.current) return null

    const svg = svgRef.current
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY

    // getScreenCTM().inverse() convierte correctamente de pantalla a viewBox
    const screenCTM = svg.getScreenCTM()
    if (!screenCTM) return null

    const svgPoint = pt.matrixTransform(screenCTM.inverse())

    // Aplicar inversa del transform del grupo (offset y scale)
    const xInGroup = (svgPoint.x - controls.offset.x) / controls.scale
    const yInGroup = (svgPoint.y - controls.offset.y) / controls.scale

    const xMetros = pixelsToMetros(xInGroup)
    const yMetros = pixelsToMetros(yInGroup)

    return {
      x: Math.max(0, Math.min(terreno.ancho_m, xMetros)),
      y: Math.max(0, Math.min(terreno.alto_m, yMetros)),
    }
  }, [controls.scale, controls.offset, terreno])

  // Convertir click a coordenadas en metros
  const handleSvgClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !onMapClick || modo !== 'ver') return

    const pos = getMousePosition(e)
    if (pos) {
      onMapClick(pos.x, pos.y)
    }
  }, [onMapClick, modo, getMousePosition])

  // Obtener plantas de una zona
  const getPlantasDeZona = useCallback((zonaId: string) => {
    return plantas.filter(p => p.zona_id === zonaId)
  }, [plantas])

  return (
    <div className="relative w-full h-full bg-gray-100 overflow-hidden">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
        className={`w-full h-full ${controls.isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={controls.handleMouseDown}
        onMouseMove={controls.handleMouseMove}
        onMouseUp={controls.handleMouseUp}
        onMouseLeave={controls.handleMouseLeave}
        onClick={handleSvgClick}
      >
        <g transform={controls.getTransform()}>
          {/* Grid de fondo */}
          <MapaGrid
            ancho={viewBox.width}
            alto={viewBox.height}
          />

          {/* Borde del terreno */}
          <rect
            x={0}
            y={0}
            width={viewBox.width}
            height={viewBox.height}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
          />

          {/* Zonas */}
          {zonas.map((zona) => (
            <ZonaRect
              key={zona.id}
              zona={zona}
              plantas={getPlantasDeZona(zona.id)}
              isSelected={zona.id === zonaSeleccionadaId}
              onClick={() => onZonaClick?.(zona)}
            />
          ))}
        </g>
      </svg>

      {/* Controles de zoom */}
      <MapaControls
        onZoomIn={controls.zoomIn}
        onZoomOut={controls.zoomOut}
        onReset={controls.resetView}
        scale={controls.scale}
      />

      {/* Escala */}
      <div className="absolute bottom-4 left-4 bg-white/90 px-2 py-1 rounded shadow text-xs">
        <div className="flex items-center gap-2">
          <div className="w-10 h-0.5 bg-black" />
          <span>1m</span>
        </div>
      </div>
    </div>
  )
}
```

---

### Tarea 4: Crear Componente ZonaRect

**Archivo**: `src/components/mapa/ZonaRect.tsx` (crear)

```typescript
'use client'

import { useMemo } from 'react'
import { PIXELS_POR_METRO } from '@/lib/utils/coordinates'
import { PlantaMarker } from './PlantaMarker'
import type { Zona, Planta } from '@/types'

interface ZonaRectProps {
  zona: Zona
  plantas: Planta[]
  isSelected?: boolean
  onClick?: () => void
}

export function ZonaRect({ zona, plantas, isSelected, onClick }: ZonaRectProps) {
  const rect = useMemo(() => ({
    x: zona.x * PIXELS_POR_METRO,
    y: zona.y * PIXELS_POR_METRO,
    width: zona.ancho * PIXELS_POR_METRO,
    height: zona.alto * PIXELS_POR_METRO,
  }), [zona])

  return (
    <g>
      {/* Rectángulo de la zona */}
      <rect
        x={rect.x}
        y={rect.y}
        width={rect.width}
        height={rect.height}
        fill={zona.color}
        fillOpacity={0.5}
        stroke={isSelected ? '#000' : zona.color}
        strokeWidth={isSelected ? 3 : 2}
        strokeDasharray={isSelected ? '5,5' : undefined}
        className="cursor-pointer transition-opacity hover:opacity-80"
        onClick={(e) => {
          e.stopPropagation()
          onClick?.()
        }}
      />

      {/* Etiqueta */}
      <text
        x={rect.x + rect.width / 2}
        y={rect.y + rect.height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-xs font-semibold pointer-events-none select-none"
        fill="#fff"
        stroke="#000"
        strokeWidth="0.5"
        paintOrder="stroke"
      >
        {zona.nombre}
      </text>

      {/* Área en esquina */}
      <text
        x={rect.x + 5}
        y={rect.y + 12}
        className="text-[8px] pointer-events-none select-none"
        fill="#fff"
        stroke="#000"
        strokeWidth="0.3"
        paintOrder="stroke"
      >
        {zona.area_m2}m²
      </text>

      {/* Plantas dentro de la zona */}
      {plantas.map((planta) => (
        <PlantaMarker
          key={planta.id}
          planta={planta}
          zonaX={zona.x}
          zonaY={zona.y}
        />
      ))}
    </g>
  )
}
```

---

### Tarea 5: Crear Componente MapaGrid

**Archivo**: `src/components/mapa/MapaGrid.tsx` (crear)

```typescript
import { PIXELS_POR_METRO } from '@/lib/utils/coordinates'

interface MapaGridProps {
  ancho: number
  alto: number
}

export function MapaGrid({ ancho, alto }: MapaGridProps) {
  return (
    <>
      <defs>
        {/* Grid de 1 metro */}
        <pattern
          id="grid-1m"
          width={PIXELS_POR_METRO}
          height={PIXELS_POR_METRO}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${PIXELS_POR_METRO} 0 L 0 0 0 ${PIXELS_POR_METRO}`}
            fill="none"
            stroke="rgba(0,0,0,0.1)"
            strokeWidth="0.5"
          />
        </pattern>

        {/* Grid de 5 metros (más visible) */}
        <pattern
          id="grid-5m"
          width={PIXELS_POR_METRO * 5}
          height={PIXELS_POR_METRO * 5}
          patternUnits="userSpaceOnUse"
        >
          <rect
            width={PIXELS_POR_METRO * 5}
            height={PIXELS_POR_METRO * 5}
            fill="url(#grid-1m)"
          />
          <path
            d={`M ${PIXELS_POR_METRO * 5} 0 L 0 0 0 ${PIXELS_POR_METRO * 5}`}
            fill="none"
            stroke="rgba(0,0,0,0.2)"
            strokeWidth="1"
          />
        </pattern>
      </defs>

      <rect
        x={0}
        y={0}
        width={ancho}
        height={alto}
        fill="url(#grid-5m)"
      />
    </>
  )
}
```

---

### Tarea 6: Crear Componente MapaControls

**Archivo**: `src/components/mapa/MapaControls.tsx` (crear)

```typescript
interface MapaControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  scale: number
}

export function MapaControls({
  onZoomIn,
  onZoomOut,
  onReset,
  scale,
}: MapaControlsProps) {
  return (
    <div className="absolute top-4 right-4 flex flex-col gap-1">
      <button
        onClick={onZoomIn}
        className="bg-white w-8 h-8 rounded shadow hover:bg-gray-50 flex items-center justify-center text-lg font-bold"
        title="Zoom In"
      >
        +
      </button>
      <button
        onClick={onZoomOut}
        className="bg-white w-8 h-8 rounded shadow hover:bg-gray-50 flex items-center justify-center text-lg font-bold"
        title="Zoom Out"
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
    </div>
  )
}
```

---

## Criterios de Aceptación

- [x] Sistema de coordenadas convierte metros ↔ píxeles correctamente
- [x] Hook `useMapControls` implementa zoom y pan
- [x] Zoom funciona con rueda del mouse (hasta 20x para zonas pequeñas)
- [x] Pan funciona arrastrando con mouse
- [x] Componente `MapaTerreno` renderiza terreno con grid
- [x] Zonas se muestran con colores y etiquetas
- [x] Click en zona dispara `onZonaClick`
- [x] Zona seleccionada tiene borde diferente
- [x] Controles de zoom (+/-/reset) funcionan
- [x] Escala visual muestra "1m" correctamente
- [x] **Panel info terreno** muestra dimensiones y área usado/disponible

---

## Siguiente Fase

**FASE_3_ZONAS** - CRUD completo de zonas con validaciones
