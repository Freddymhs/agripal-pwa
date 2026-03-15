import { useEffect, useRef, type MutableRefObject } from "react";
import { Application } from "pixi.js";
import { PixiHitTest } from "./pixi-hit-test";
import { PixiOverlayLayer } from "./pixi-overlay-layer";
import { PixiCursorGuidesLayer } from "./pixi-cursor-guides-layer";
import { PIXELS_POR_METRO } from "./pixi-constants";
import { snapToGrid } from "@/lib/validations/planta";
import type { Planta, Zona } from "@/types";
import { MODO, TIPO_ZONA } from "@/lib/constants/entities";
import { logger } from "@/lib/logger";
import type { GridParams } from "@/lib/validations/planta";
import type { Point } from "./pixi-map-types";

interface InteractionProps {
  zonas: Zona[];
  plantas: Planta[];
  zonaSeleccionadaId?: string | null;
  cultivosEspaciado: Record<string, number>;
  plantasSeleccionadasIds: string[];
  gridParams: GridParams | null;
  posicionesOcupadas: Set<string>;
  terreno: { ancho_m: number; alto_m: number };
  onZonaClick?: (zona: Zona) => void;
  onMapClick?: (x: number, y: number) => void;
  onPlantaClick?: (planta: Planta) => void;
  onZonaCreada?: (rect: {
    x: number;
    y: number;
    ancho: number;
    alto: number;
  }) => void;
  onSeleccionMultiple?: (plantaIds: string[]) => void;
  onMoverPlantasSeleccionadas?: (
    plantaId: string,
    deltaX: number,
    deltaY: number,
  ) => Promise<void>;
}

interface InteractionDeps {
  app: Application | null;
  modoRef: MutableRefObject<string>;
  propsRef: MutableRefObject<InteractionProps>;
  hitTestRef: MutableRefObject<PixiHitTest | null>;
  overlayLayerRef: MutableRefObject<PixiOverlayLayer | null>;
  cursorGuidesLayerRef: MutableRefObject<PixiCursorGuidesLayer | null>;
  screenToWorld: (screenX: number, screenY: number) => Point;
  viewport: {
    scaleRef: MutableRefObject<number>;
    isPanningRef: MutableRefObject<boolean>;
    startPan: (clientX: number, clientY: number) => void;
    movePan: (clientX: number, clientY: number) => void;
    endPan: () => void;
  };
  calcSnapGuides: (cursorMetros: Point) => {
    verticalX: number | null;
    horizontalY: number | null;
  };
  snapPosition: (pos: Point) => Point;
}

const DRAG_THRESHOLD = 5;

export function useMapInteractions(deps: InteractionDeps) {
  const wasDraggingRef = useRef(false);
  const pointerDownScreenRef = useRef<Point | null>(null);

  const {
    app,
    modoRef,
    propsRef,
    hitTestRef,
    overlayLayerRef,
    cursorGuidesLayerRef,
    screenToWorld,
    viewport,
    calcSnapGuides,
    snapPosition,
  } = deps;

  useEffect(() => {
    if (!app) return;

    const canvas = app.canvas as HTMLCanvasElement;
    let isDrawing = false;
    let drawStart: Point | null = null;
    let isSelecting = false;
    let selectionStart: Point | null = null;
    let isMovingPlants = false;
    let dragStartWorld: Point | null = null;
    const originalPlantaPositions = new Map<string, Point>();

    const getMousePos = (e: PointerEvent): Point => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const getPlantaSeleccionadaEnPos = (worldPos: Point): Planta | null => {
      const p = propsRef.current;
      if (!p.plantasSeleccionadasIds || p.plantasSeleccionadasIds.length === 0)
        return null;

      const metrosX = worldPos.x / PIXELS_POR_METRO;
      const metrosY = worldPos.y / PIXELS_POR_METRO;

      for (const planta of p.plantas) {
        if (!p.plantasSeleccionadasIds.includes(planta.id)) continue;
        const zona = p.zonas.find((z) => z.id === planta.zona_id);
        if (!zona) continue;

        const absX = zona.x + planta.x;
        const absY = zona.y + planta.y;
        const espaciado = p.cultivosEspaciado[planta.tipo_cultivo_id] || 3;
        const radius = espaciado / 2;

        const dist = Math.sqrt((metrosX - absX) ** 2 + (metrosY - absY) ** 2);
        if (dist <= radius + 0.2) return planta;
      }
      return null;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const screenPos = getMousePos(e);
      pointerDownScreenRef.current = { x: e.clientX, y: e.clientY };
      wasDraggingRef.current = false;
      const worldPos = screenToWorld(screenPos.x, screenPos.y);
      const currentModo = modoRef.current;

      if (currentModo === MODO.CREAR_ZONA) {
        const metrosX = worldPos.x / PIXELS_POR_METRO;
        const metrosY = worldPos.y / PIXELS_POR_METRO;
        const clamped = {
          x: Math.max(0, Math.min(propsRef.current.terreno.ancho_m, metrosX)),
          y: Math.max(0, Math.min(propsRef.current.terreno.alto_m, metrosY)),
        };
        const snapped = snapPosition(clamped);
        drawStart = snapped;
        isDrawing = true;
        return;
      }

      if (
        currentModo === MODO.PLANTAS &&
        e.shiftKey &&
        propsRef.current.onSeleccionMultiple
      ) {
        selectionStart = worldPos;
        isSelecting = true;
        return;
      }

      if (currentModo === MODO.PLANTAS && !e.shiftKey) {
        const plantaSel = getPlantaSeleccionadaEnPos(worldPos);
        if (plantaSel) {
          isMovingPlants = true;
          dragStartWorld = worldPos;
          originalPlantaPositions.clear();
          for (const id of propsRef.current.plantasSeleccionadasIds || []) {
            const planta = propsRef.current.plantas.find((p) => p.id === id);
            if (planta) {
              originalPlantaPositions.set(id, { x: planta.x, y: planta.y });
            }
          }
          return;
        }
        // Si hay una planta bajo el cursor (aunque no esté en la selección actual),
        // no iniciar pan ni trackear drag — dejar que onPointerTap maneje el click.
        const plantaEnPos = hitTestRef.current?.hitTestPoint(
          worldPos.x,
          worldPos.y,
        );
        if (plantaEnPos) {
          pointerDownScreenRef.current = null;
          return;
        }
      }

      viewport.startPan(e.clientX, e.clientY);
      canvas.style.cursor = "grabbing";
    };

    const onPointerMove = (e: PointerEvent) => {
      if (pointerDownScreenRef.current) {
        const dx = e.clientX - pointerDownScreenRef.current.x;
        const dy = e.clientY - pointerDownScreenRef.current.y;
        if (dx * dx + dy * dy > DRAG_THRESHOLD * DRAG_THRESHOLD) {
          wasDraggingRef.current = true;
        }
      }

      const screenPos = getMousePos(e);
      const worldPos = screenToWorld(screenPos.x, screenPos.y);
      const currentModo = modoRef.current;
      const scale = viewport.scaleRef.current;

      if (currentModo === MODO.CREAR_ZONA) {
        handleCrearZonaMove(worldPos, scale, isDrawing, drawStart);
        return;
      }

      if (currentModo === MODO.PLANTAR) {
        handlePlantarMove(worldPos, scale);
      }

      if (isSelecting && selectionStart) {
        overlayLayerRef.current?.drawSelectionRect(
          selectionStart,
          worldPos,
          scale,
        );
        return;
      }

      if (isMovingPlants && dragStartWorld) {
        handleMovingPlantsMove(
          worldPos,
          dragStartWorld,
          originalPlantaPositions,
          scale,
        );
        return;
      }

      if (viewport.isPanningRef.current) {
        viewport.movePan(e.clientX, e.clientY);
        return;
      }

      if (currentModo === MODO.PLANTAS) {
        handlePlantasHover(worldPos, canvas, scale);
      } else {
        canvas.style.cursor = "grab";
        overlayLayerRef.current?.clearPlantaHover();
      }
    };

    const handleCrearZonaMove = (
      worldPos: Point,
      scale: number,
      drawing: boolean,
      start: Point | null,
    ) => {
      const metrosX = worldPos.x / PIXELS_POR_METRO;
      const metrosY = worldPos.y / PIXELS_POR_METRO;
      const p = propsRef.current;
      const clamped = {
        x: Math.max(0, Math.min(p.terreno.ancho_m, metrosX)),
        y: Math.max(0, Math.min(p.terreno.alto_m, metrosY)),
      };
      const guides = calcSnapGuides(clamped);
      overlayLayerRef.current?.drawSnapGuides(
        guides.verticalX,
        guides.horizontalY,
        p.terreno.ancho_m,
        p.terreno.alto_m,
        scale,
      );

      // Snap siempre al grid de 0.5m (+ edges de zonas)
      const snapped = snapPosition(clamped);

      if (drawing && start) {
        // Durante el dibujo: ocultar cursor guides y coord, mostrar preview + esquinas
        cursorGuidesLayerRef.current?.clear();
        overlayLayerRef.current?.clearCursorCoord();
        const startPx = {
          x: start.x * PIXELS_POR_METRO,
          y: start.y * PIXELS_POR_METRO,
        };
        const currentPx = {
          x: snapped.x * PIXELS_POR_METRO,
          y: snapped.y * PIXELS_POR_METRO,
        };
        overlayLayerRef.current?.drawCreateZona(startPx, currentPx, scale);
      } else {
        // Antes de clic: mostrar posición snapped + distancias a bordes/zonas
        overlayLayerRef.current?.drawCursorCoord(snapped.x, snapped.y, scale);
        cursorGuidesLayerRef.current?.update(
          snapped.x,
          snapped.y,
          p.zonas,
          p.terreno,
          scale,
        );
      }
    };

    const handlePlantarMove = (worldPos: Point, scale: number) => {
      const p = propsRef.current;
      const gp = p.gridParams;
      const zonaSelId = p.zonaSeleccionadaId;
      const zona = zonaSelId ? p.zonas.find((z) => z.id === zonaSelId) : null;

      if (gp && zona && zona.tipo === TIPO_ZONA.CULTIVO) {
        const metrosX = worldPos.x / PIXELS_POR_METRO;
        const metrosY = worldPos.y / PIXELS_POR_METRO;
        const relX = metrosX - zona.x;
        const relY = metrosY - zona.y;

        if (relX >= 0 && relX <= zona.ancho && relY >= 0 && relY <= zona.alto) {
          const snapped = snapToGrid(relX, relY, gp, p.posicionesOcupadas);
          if (snapped) {
            const absX = zona.x + snapped.x;
            const absY = zona.y + snapped.y;
            const preview = new Map<string, { x: number; y: number }>();
            preview.set("snap-preview", { x: absX, y: absY });
            const radius = (gp.espaciado / 2) * PIXELS_POR_METRO;
            overlayLayerRef.current?.drawPlantasPreview(preview, scale, radius);
          } else {
            overlayLayerRef.current?.clearPlantasPreview();
          }
        } else {
          overlayLayerRef.current?.clearPlantasPreview();
        }
      } else {
        overlayLayerRef.current?.clearPlantasPreview();
      }
    };

    const handleMovingPlantsMove = (
      worldPos: Point,
      startWorld: Point,
      origPositions: Map<string, Point>,
      scale: number,
    ) => {
      const deltaX = (worldPos.x - startWorld.x) / PIXELS_POR_METRO;
      const deltaY = (worldPos.y - startWorld.y) / PIXELS_POR_METRO;
      const t = propsRef.current.terreno;

      const preview = new Map<string, { x: number; y: number }>();
      for (const [id, origPos] of origPositions) {
        const planta = propsRef.current.plantas.find((p) => p.id === id);
        if (!planta) continue;
        const zona = propsRef.current.zonas.find(
          (z) => z.id === planta.zona_id,
        );
        if (!zona) continue;

        preview.set(id, {
          x: Math.max(0, Math.min(t.ancho_m, zona.x + origPos.x + deltaX)),
          y: Math.max(0, Math.min(t.alto_m, zona.y + origPos.y + deltaY)),
        });
      }
      overlayLayerRef.current?.drawPlantasPreview(preview, scale);
    };

    const handlePlantasHover = (
      worldPos: Point,
      cvs: HTMLCanvasElement,
      scale: number,
    ) => {
      if (!hitTestRef.current) {
        logger.warn("hitTestRef is null in plantas mode");
        return;
      }
      const planta = hitTestRef.current.hitTestPoint(worldPos.x, worldPos.y);
      cvs.style.cursor = planta ? "pointer" : "grab";
      if (planta) {
        const zona = propsRef.current.zonas.find(
          (z) => z.id === planta.zona_id,
        );
        if (zona) {
          const absX = (zona.x + planta.x) * PIXELS_POR_METRO;
          const absY = (zona.y + planta.y) * PIXELS_POR_METRO;
          const espaciado =
            propsRef.current.cultivosEspaciado[planta.tipo_cultivo_id] || 3;
          const radius = (espaciado / 2) * PIXELS_POR_METRO;
          overlayLayerRef.current?.drawPlantaHover(absX, absY, radius, scale);
        }
      } else {
        overlayLayerRef.current?.clearPlantaHover();
      }
    };

    const onPointerUp = async (e: PointerEvent) => {
      const screenPos = getMousePos(e);
      const worldPos = screenToWorld(screenPos.x, screenPos.y);
      const currentModo = modoRef.current;
      const p = propsRef.current;

      if (currentModo === MODO.CREAR_ZONA && isDrawing && drawStart) {
        const metrosX = worldPos.x / PIXELS_POR_METRO;
        const metrosY = worldPos.y / PIXELS_POR_METRO;
        const clamped = {
          x: Math.max(0, Math.min(p.terreno.ancho_m, metrosX)),
          y: Math.max(0, Math.min(p.terreno.alto_m, metrosY)),
        };
        const snapped = snapPosition(clamped);

        const rect = {
          x: Math.round(Math.min(drawStart.x, snapped.x) * 2) / 2,
          y: Math.round(Math.min(drawStart.y, snapped.y) * 2) / 2,
          ancho: Math.round(Math.abs(snapped.x - drawStart.x) * 2) / 2,
          alto: Math.round(Math.abs(snapped.y - drawStart.y) * 2) / 2,
        };

        if (rect.ancho >= 1 && rect.alto >= 1) {
          p.onZonaCreada?.(rect);
        }

        isDrawing = false;
        drawStart = null;
        overlayLayerRef.current?.clearCreateZona();
        overlayLayerRef.current?.clearSnapGuides();
        cursorGuidesLayerRef.current?.clear();
        return;
      }

      if (isSelecting && selectionStart) {
        const minX = Math.min(selectionStart.x, worldPos.x) / PIXELS_POR_METRO;
        const maxX = Math.max(selectionStart.x, worldPos.x) / PIXELS_POR_METRO;
        const minY = Math.min(selectionStart.y, worldPos.y) / PIXELS_POR_METRO;
        const maxY = Math.max(selectionStart.y, worldPos.y) / PIXELS_POR_METRO;

        const plantasEnRect = p.plantas.filter((planta) => {
          const zona = p.zonas.find((z) => z.id === planta.zona_id);
          if (!zona) return false;
          const absX = zona.x + planta.x;
          const absY = zona.y + planta.y;
          return absX >= minX && absX <= maxX && absY >= minY && absY <= maxY;
        });

        if (plantasEnRect.length > 0) {
          p.onSeleccionMultiple?.(plantasEnRect.map((pl) => pl.id));
        }

        isSelecting = false;
        selectionStart = null;
        overlayLayerRef.current?.clearSelectionRect();
        return;
      }

      if (isMovingPlants && dragStartWorld && p.onMoverPlantasSeleccionadas) {
        const deltaX = (worldPos.x - dragStartWorld.x) / PIXELS_POR_METRO;
        const deltaY = (worldPos.y - dragStartWorld.y) / PIXELS_POR_METRO;

        if (Math.abs(deltaX) > 0.01 || Math.abs(deltaY) > 0.01) {
          for (const plantaId of p.plantasSeleccionadasIds || []) {
            await p.onMoverPlantasSeleccionadas(plantaId, deltaX, deltaY);
          }
        }

        isMovingPlants = false;
        dragStartWorld = null;
        originalPlantaPositions.clear();
        overlayLayerRef.current?.clearPlantasPreview();
        return;
      }

      if (viewport.isPanningRef.current) {
        viewport.endPan();
        canvas.style.cursor = "grab";
      }
    };

    const onPointerLeave = () => {
      cursorGuidesLayerRef.current?.clear();
      if (isDrawing) {
        isDrawing = false;
        drawStart = null;
        overlayLayerRef.current?.clearCreateZona();
        overlayLayerRef.current?.clearSnapGuides();
      }
      if (isSelecting) {
        isSelecting = false;
        selectionStart = null;
        overlayLayerRef.current?.clearSelectionRect();
      }
      if (isMovingPlants) {
        isMovingPlants = false;
        dragStartWorld = null;
        originalPlantaPositions.clear();
        overlayLayerRef.current?.clearPlantasPreview();
      }
      if (modoRef.current === MODO.PLANTAR) {
        overlayLayerRef.current?.clearPlantasPreview();
      }
      overlayLayerRef.current?.clearPlantaHover();
      viewport.endPan();
    };

    const onPointerTap = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const screenPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const worldPos = screenToWorld(screenPos.x, screenPos.y);
      const currentModo = modoRef.current;
      const p = propsRef.current;

      // En modo plantas: siempre verificar hitTest primero.
      // Si el click aterriza sobre una planta, seleccionarla sin importar wasDragging.
      // (Si el usuario arrastró mucho, el browser no dispara click en absoluto.)
      if (currentModo === MODO.PLANTAS) {
        const planta = hitTestRef.current?.hitTestPoint(worldPos.x, worldPos.y);
        wasDraggingRef.current = false;
        pointerDownScreenRef.current = null;
        if (planta) {
          p.onPlantaClick?.(planta);
        }
        return;
      }

      if (wasDraggingRef.current) {
        wasDraggingRef.current = false;
        pointerDownScreenRef.current = null;
        return;
      }
      pointerDownScreenRef.current = null;

      if (currentModo === MODO.PLANTAR && p.onMapClick) {
        handlePlantarTap(worldPos, p);
        return;
      }

      if (currentModo === MODO.ZONAS && p.onZonaClick) {
        const metrosX = worldPos.x / PIXELS_POR_METRO;
        const metrosY = worldPos.y / PIXELS_POR_METRO;
        const zonaHit = p.zonas.find(
          (z) =>
            metrosX >= z.x &&
            metrosX <= z.x + z.ancho &&
            metrosY >= z.y &&
            metrosY <= z.y + z.alto,
        );
        if (zonaHit) {
          p.onZonaClick(zonaHit);
        }
      }
    };

    const handlePlantarTap = (worldPos: Point, p: InteractionProps) => {
      const metrosX = worldPos.x / PIXELS_POR_METRO;
      const metrosY = worldPos.y / PIXELS_POR_METRO;
      const gp = p.gridParams;
      const zonaSelId = p.zonaSeleccionadaId;
      const zona = zonaSelId ? p.zonas.find((z) => z.id === zonaSelId) : null;

      if (gp && zona && zona.tipo === TIPO_ZONA.CULTIVO) {
        const relX = metrosX - zona.x;
        const relY = metrosY - zona.y;
        if (relX >= 0 && relX <= zona.ancho && relY >= 0 && relY <= zona.alto) {
          const snapped = snapToGrid(relX, relY, gp, p.posicionesOcupadas);
          if (snapped) {
            p.onMapClick!(zona.x + snapped.x, zona.y + snapped.y);
          } else {
            p.onMapClick!(metrosX, metrosY);
          }
        } else {
          p.onMapClick!(metrosX, metrosY);
        }
      } else {
        p.onMapClick!(metrosX, metrosY);
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("click", onPointerTap);

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("click", onPointerTap);
    };
  }, [
    app,
    screenToWorld,
    viewport,
    calcSnapGuides,
    snapPosition,
    modoRef,
    propsRef,
    hitTestRef,
    overlayLayerRef,
    cursorGuidesLayerRef,
  ]);
}
