import { useCallback, type MutableRefObject } from "react";
import type { Terreno, Zona } from "@/types";
import type { Point } from "./pixi-map-types";
import { SNAP_THRESHOLD } from "./pixi-map-types";

interface PropsRef {
  terreno: Terreno;
  zonas: Zona[];
}

export function useMapSnap(propsRef: MutableRefObject<PropsRef>) {
  const calcSnapGuides = useCallback(
    (
      cursorMetros: Point,
    ): { verticalX: number | null; horizontalY: number | null } => {
      const t = propsRef.current.terreno;
      const z = propsRef.current.zonas;
      const edgesX: number[] = [0, t.ancho_m];
      const edgesY: number[] = [0, t.alto_m];

      for (const zona of z) {
        edgesX.push(zona.x, zona.x + zona.ancho);
        edgesY.push(zona.y, zona.y + zona.alto);
      }

      let closestX: number | null = null;
      let minDistX = SNAP_THRESHOLD;
      for (const edge of edgesX) {
        const dist = Math.abs(cursorMetros.x - edge);
        if (dist < minDistX) {
          minDistX = dist;
          closestX = edge;
        }
      }

      let closestY: number | null = null;
      let minDistY = SNAP_THRESHOLD;
      for (const edge of edgesY) {
        const dist = Math.abs(cursorMetros.y - edge);
        if (dist < minDistY) {
          minDistY = dist;
          closestY = edge;
        }
      }

      return { verticalX: closestX, horizontalY: closestY };
    },
    [propsRef],
  );

  const snapPosition = useCallback(
    (pos: Point): Point => {
      const snapped = { x: pos.x, y: pos.y };
      const t = propsRef.current.terreno;
      const z = propsRef.current.zonas;
      const edgesX: number[] = [0, t.ancho_m];
      const edgesY: number[] = [0, t.alto_m];

      for (const zona of z) {
        edgesX.push(zona.x, zona.x + zona.ancho);
        edgesY.push(zona.y, zona.y + zona.alto);
      }

      for (const edge of edgesX) {
        if (Math.abs(snapped.x - edge) < SNAP_THRESHOLD) snapped.x = edge;
      }
      for (const edge of edgesY) {
        if (Math.abs(snapped.y - edge) < SNAP_THRESHOLD) snapped.y = edge;
      }

      return snapped;
    },
    [propsRef],
  );

  return { calcSnapGuides, snapPosition };
}
