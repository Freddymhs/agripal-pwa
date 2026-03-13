import { Container, Graphics, Text } from "pixi.js";
import { PIXELS_POR_METRO } from "./pixi-constants";
import type { Zona, Terreno } from "@/types";

export const COLOR_SPACING = 0x2563eb;

const MIN_DISTANCIA_VISIBLE_M = 0.1;

interface SpacingLine {
  x1: number; // px
  y1: number;
  x2: number;
  y2: number;
  labelM: number;
  isHorizontal: boolean;
}

interface ZonaBounds {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function toBounds(z: Zona): ZonaBounds {
  return { id: z.id, x1: z.x, y1: z.y, x2: z.x + z.ancho, y2: z.y + z.alto };
}

function seSuperponeEnY(a: ZonaBounds, b: ZonaBounds): boolean {
  return b.y1 < a.y2 && b.y2 > a.y1;
}

function seSuperponeEnX(a: ZonaBounds, b: ZonaBounds): boolean {
  return b.x1 < a.x2 && b.x2 > a.x1;
}

function encontrarLimiteMax(
  otras: ZonaBounds[],
  obtenerBorde: (b: ZonaBounds) => number,
  filtro: (b: ZonaBounds) => boolean,
  valorBase: number,
): number {
  return otras
    .filter(filtro)
    .reduce((acc, b) => Math.max(acc, obtenerBorde(b)), valorBase);
}

function encontrarLimiteMin(
  otras: ZonaBounds[],
  obtenerBorde: (b: ZonaBounds) => number,
  filtro: (b: ZonaBounds) => boolean,
  valorBase: number,
): number {
  return otras
    .filter(filtro)
    .reduce((acc, b) => Math.min(acc, obtenerBorde(b)), valorBase);
}

function crearLineaSiVisible(
  desde: number,
  hasta: number,
  mid: number,
  isHorizontal: boolean,
): SpacingLine | null {
  const distM = hasta - desde;
  if (distM <= MIN_DISTANCIA_VISIBLE_M) return null;

  const midPx = mid * PIXELS_POR_METRO;
  return isHorizontal
    ? {
        x1: desde * PIXELS_POR_METRO,
        y1: midPx,
        x2: hasta * PIXELS_POR_METRO,
        y2: midPx,
        labelM: distM,
        isHorizontal,
      }
    : {
        x1: midPx,
        y1: desde * PIXELS_POR_METRO,
        x2: midPx,
        y2: hasta * PIXELS_POR_METRO,
        labelM: distM,
        isHorizontal,
      };
}

/**
 * Calcula la distancia en cada dirección desde una zona hacia:
 * - El borde más cercano de otra zona que se superponga en el eje perpendicular
 * - O el borde del terreno si no hay ninguna zona intermedia
 */
function calcularLineas(
  zonas: Zona[],
  terrenoAncho: number,
  terrenoAlto: number,
): SpacingLine[] {
  const bounds = zonas.map(toBounds);

  return bounds.flatMap((a) => {
    const otras = bounds.filter((b) => b.id !== a.id);
    const midY = (a.y1 + a.y2) / 2;
    const midX = (a.x1 + a.x2) / 2;

    const izquierda = encontrarLimiteMax(
      otras,
      (b) => b.x2,
      (b) => b.x2 <= a.x1 && seSuperponeEnY(a, b),
      0,
    );
    const derecha = encontrarLimiteMin(
      otras,
      (b) => b.x1,
      (b) => b.x1 >= a.x2 && seSuperponeEnY(a, b),
      terrenoAncho,
    );
    const arriba = encontrarLimiteMax(
      otras,
      (b) => b.y2,
      (b) => b.y2 <= a.y1 && seSuperponeEnX(a, b),
      0,
    );
    const abajo = encontrarLimiteMin(
      otras,
      (b) => b.y1,
      (b) => b.y1 >= a.y2 && seSuperponeEnX(a, b),
      terrenoAlto,
    );

    return [
      crearLineaSiVisible(izquierda, a.x1, midY, true),
      crearLineaSiVisible(a.x2, derecha, midY, true),
      crearLineaSiVisible(arriba, a.y1, midX, false),
      crearLineaSiVisible(a.y2, abajo, midX, false),
    ].filter((line): line is SpacingLine => line !== null);
  });
}

export class PixiSpacingLayer {
  container: Container;
  private graphics: Graphics;
  private labels: Text[] = [];

  constructor() {
    this.container = new Container();
    this.graphics = new Graphics();
    this.container.addChild(this.graphics);
  }

  build(zonas: Zona[], terreno: Terreno, scale: number): void {
    this.clear();

    const lines = calcularLineas(zonas, terreno.ancho_m, terreno.alto_m);
    const g = this.graphics;
    const lineW = Math.max(1, 1.5 / scale);
    const arrowSize = Math.max(3, 6 / scale);
    const fontSize = Math.max(9, 12 / scale);

    for (const line of lines) {
      const { x1, y1, x2, y2, labelM, isHorizontal } = line;

      // línea principal
      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
      g.stroke({ color: COLOR_SPACING, width: lineW, alpha: 0.85 });

      // flechas de doble punta
      if (isHorizontal) {
        // punta izquierda
        g.moveTo(x1, y1);
        g.lineTo(x1 + arrowSize, y1 - arrowSize);
        g.moveTo(x1, y1);
        g.lineTo(x1 + arrowSize, y1 + arrowSize);
        // punta derecha
        g.moveTo(x2, y2);
        g.lineTo(x2 - arrowSize, y2 - arrowSize);
        g.moveTo(x2, y2);
        g.lineTo(x2 - arrowSize, y2 + arrowSize);
      } else {
        // punta arriba
        g.moveTo(x1, y1);
        g.lineTo(x1 - arrowSize, y1 + arrowSize);
        g.moveTo(x1, y1);
        g.lineTo(x1 + arrowSize, y1 + arrowSize);
        // punta abajo
        g.moveTo(x2, y2);
        g.lineTo(x2 - arrowSize, y2 - arrowSize);
        g.moveTo(x2, y2);
        g.lineTo(x2 + arrowSize, y2 - arrowSize);
      }
      g.stroke({ color: COLOR_SPACING, width: lineW, alpha: 0.85 });

      // label centrado con fondo blanco
      const labelStr = `${labelM.toFixed(1)}m`;
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;

      const bg = new Graphics();
      const pad = fontSize * 0.35;
      const approxW = labelStr.length * fontSize * 0.55 + pad * 2;
      const approxH = fontSize + pad * 2;
      bg.rect(-approxW / 2, -approxH / 2, approxW, approxH);
      bg.fill({ color: 0xffffff, alpha: 0.88 });
      bg.position.set(midX, midY);
      this.container.addChild(bg);
      this.labels.push(bg as unknown as Text);

      const label = new Text({
        text: labelStr,
        style: {
          fontSize,
          fill: COLOR_SPACING,
          fontFamily: "monospace",
          fontWeight: "bold",
        },
      });
      label.anchor.set(0.5);
      label.position.set(midX, midY);
      this.container.addChild(label);
      this.labels.push(label);
    }
  }

  clear(): void {
    if (!this.graphics || this.graphics.destroyed) return;
    this.graphics.clear();
    for (const obj of this.labels) {
      if (!obj.destroyed) obj.destroy();
    }
    this.labels = [];
  }

  destroy(): void {
    this.clear();
    if (this.graphics && !this.graphics.destroyed) this.graphics.destroy();
    (this as unknown as { graphics: Graphics | null }).graphics = null;
    if (!this.container.destroyed) this.container.destroy();
  }
}
