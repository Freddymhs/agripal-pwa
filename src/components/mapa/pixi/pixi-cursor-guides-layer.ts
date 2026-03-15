/**
 * Cursor Guides Layer — muestra distancias en tiempo real desde la posición
 * del cursor hasta los bordes más cercanos (zonas existentes o terreno).
 *
 * Activo solo en modo "crear_zona" antes de hacer clic (pre-drawing).
 * Reutiliza el estilo visual del spacing layer (líneas azules + flechas + labels).
 */

import { Container, Graphics, Text } from "pixi.js";
import { PIXELS_POR_METRO } from "./pixi-constants";
import { COLOR_SPACING } from "./pixi-spacing-layer";
import type { Zona } from "@/types";

const MIN_DISTANCIA_VISIBLE_M = 0.3;
const NUM_GUIAS = 4; // izquierda, derecha, arriba, abajo
const LABEL_MIN_PX = 15;

interface ZonaBounds {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function toBounds(z: Zona): ZonaBounds {
  return { x1: z.x, y1: z.y, x2: z.x + z.ancho, y2: z.y + z.alto };
}

function contienePoint(b: ZonaBounds, cx: number, cy: number): boolean {
  return cx >= b.x1 && cx <= b.x2 && cy >= b.y1 && cy <= b.y2;
}

export class PixiCursorGuidesLayer {
  container: Container;
  private graphics: Graphics;
  private labels: Text[];
  private backgrounds: Graphics[];

  constructor() {
    this.container = new Container();
    this.graphics = new Graphics();
    this.container.addChild(this.graphics);

    this.labels = [];
    this.backgrounds = [];

    for (let i = 0; i < NUM_GUIAS; i++) {
      const bg = new Graphics();
      bg.visible = false;
      this.container.addChild(bg);
      this.backgrounds.push(bg);

      const label = new Text({
        text: "",
        style: {
          fontSize: 12,
          fill: COLOR_SPACING,
          fontFamily: "monospace",
          fontWeight: "bold",
        },
      });
      label.anchor.set(0.5);
      label.visible = false;
      this.container.addChild(label);
      this.labels.push(label);
    }
  }

  update(
    cursorX: number,
    cursorY: number,
    zonas: Zona[],
    terreno: { ancho_m: number; alto_m: number },
    scale: number,
  ): void {
    this.graphics.clear();

    const allBounds = zonas.map(toBounds);
    // Excluir zonas en las que el cursor está adentro
    const bounds = allBounds.filter((b) => !contienePoint(b, cursorX, cursorY));

    const cursorPxX = cursorX * PIXELS_POR_METRO;
    const cursorPxY = cursorY * PIXELS_POR_METRO;

    // Izquierda: borde derecho más cercano de zonas a la izquierda (que cubran cursorY)
    const izquierda = bounds
      .filter((b) => b.x2 <= cursorX && b.y1 < cursorY && b.y2 > cursorY)
      .reduce((max, b) => Math.max(max, b.x2), 0);

    // Derecha: borde izquierdo más cercano de zonas a la derecha
    const derecha = bounds
      .filter((b) => b.x1 >= cursorX && b.y1 < cursorY && b.y2 > cursorY)
      .reduce((min, b) => Math.min(min, b.x1), terreno.ancho_m);

    // Arriba: borde inferior más cercano de zonas arriba
    const arriba = bounds
      .filter((b) => b.y2 <= cursorY && b.x1 < cursorX && b.x2 > cursorX)
      .reduce((max, b) => Math.max(max, b.y2), 0);

    // Abajo: borde superior más cercano de zonas abajo
    const abajo = bounds
      .filter((b) => b.y1 >= cursorY && b.x1 < cursorX && b.x2 > cursorX)
      .reduce((min, b) => Math.min(min, b.y1), terreno.alto_m);

    const guides = [
      { from: izquierda, to: cursorX, mid: cursorPxY, isH: true },
      { from: cursorX, to: derecha, mid: cursorPxY, isH: true },
      { from: arriba, to: cursorY, mid: cursorPxX, isH: false },
      { from: cursorY, to: abajo, mid: cursorPxX, isH: false },
    ];

    const lineW = Math.max(1, 1.5 / scale);
    const arrowSize = Math.max(3, 5 / scale);
    const fontSize = Math.max(9, 11 / scale);

    for (let i = 0; i < NUM_GUIAS; i++) {
      const guide = guides[i];
      const distM = guide.to - guide.from;

      if (distM < MIN_DISTANCIA_VISIBLE_M) {
        this.labels[i].visible = false;
        this.backgrounds[i].visible = false;
        continue;
      }

      const x1 = guide.isH ? guide.from * PIXELS_POR_METRO : guide.mid;
      const y1 = guide.isH ? guide.mid : guide.from * PIXELS_POR_METRO;
      const x2 = guide.isH ? guide.to * PIXELS_POR_METRO : guide.mid;
      const y2 = guide.isH ? guide.mid : guide.to * PIXELS_POR_METRO;

      // Línea principal
      this.graphics.moveTo(x1, y1);
      this.graphics.lineTo(x2, y2);
      this.graphics.stroke({ color: COLOR_SPACING, width: lineW, alpha: 0.7 });

      // Flechas de doble punta
      if (guide.isH) {
        this.graphics.moveTo(x1, y1).lineTo(x1 + arrowSize, y1 - arrowSize);
        this.graphics.moveTo(x1, y1).lineTo(x1 + arrowSize, y1 + arrowSize);
        this.graphics.moveTo(x2, y2).lineTo(x2 - arrowSize, y2 - arrowSize);
        this.graphics.moveTo(x2, y2).lineTo(x2 - arrowSize, y2 + arrowSize);
      } else {
        this.graphics.moveTo(x1, y1).lineTo(x1 - arrowSize, y1 + arrowSize);
        this.graphics.moveTo(x1, y1).lineTo(x1 + arrowSize, y1 + arrowSize);
        this.graphics.moveTo(x2, y2).lineTo(x2 - arrowSize, y2 - arrowSize);
        this.graphics.moveTo(x2, y2).lineTo(x2 + arrowSize, y2 - arrowSize);
      }
      this.graphics.stroke({ color: COLOR_SPACING, width: lineW, alpha: 0.7 });

      // Label con fondo
      const labelStr = `${distM.toFixed(1)}m`;
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const pixelDist = guide.isH ? Math.abs(x2 - x1) : Math.abs(y2 - y1);

      if (pixelDist >= LABEL_MIN_PX) {
        const maxFontForSpace = pixelDist / (labelStr.length * 0.65);
        const labelFontSize = Math.max(7, Math.min(fontSize, maxFontForSpace));

        const bg = this.backgrounds[i];
        bg.clear();
        const pad = labelFontSize * 0.35;
        const approxW = labelStr.length * labelFontSize * 0.55 + pad * 2;
        const approxH = labelFontSize + pad * 2;
        bg.rect(-approxW / 2, -approxH / 2, approxW, approxH);
        bg.fill({ color: 0xffffff, alpha: 0.75 });
        bg.position.set(midX, midY);
        bg.visible = true;

        const label = this.labels[i];
        label.text = labelStr;
        label.style.fontSize = labelFontSize;
        label.position.set(midX, midY);
        label.visible = true;
      } else {
        this.labels[i].visible = false;
        this.backgrounds[i].visible = false;
      }
    }
  }

  clear(): void {
    this.graphics.clear();
    for (let i = 0; i < NUM_GUIAS; i++) {
      this.labels[i].visible = false;
      this.backgrounds[i].visible = false;
    }
  }

  destroy(): void {
    this.clear();
    if (!this.graphics.destroyed) this.graphics.destroy();
    for (const label of this.labels) {
      if (!label.destroyed) label.destroy();
    }
    for (const bg of this.backgrounds) {
      if (!bg.destroyed) bg.destroy();
    }
    if (!this.container.destroyed) this.container.destroy();
  }
}
