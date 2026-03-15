import { Container, Graphics, Text } from "pixi.js";
import {
  PIXELS_POR_METRO,
  COLOR_SELECCION,
  COLOR_SNAP,
  COLOR_PREVIEW_VALIDA,
  COLOR_PREVIEW_INVALIDA,
  COLOR_HOVER,
} from "./pixi-constants";

const COLOR_COORD = 0x1e40af;
const COORD_BG_COLOR = 0xffffff;
const COORD_BG_ALPHA = 0.85;

export class PixiOverlayLayer {
  container: Container;
  private selectionGraphics: Graphics;
  private snapGraphics: Graphics;
  private zonaPreviewGraphics: Graphics;
  private drawZonaGraphics: Graphics;
  private plantaPreviewGraphics: Graphics;
  private plantaHoverGraphics: Graphics;
  private dimensionText: Text;
  // Cursor coordinate indicator
  private cursorCoordBg: Graphics;
  private cursorCoordText: Text;
  // Corner labels while drawing
  private cornerStartBg: Graphics;
  private cornerStartText: Text;
  private cornerEndBg: Graphics;
  private cornerEndText: Text;

  constructor() {
    this.container = new Container();

    this.selectionGraphics = new Graphics();
    this.snapGraphics = new Graphics();
    this.zonaPreviewGraphics = new Graphics();
    this.drawZonaGraphics = new Graphics();
    this.plantaPreviewGraphics = new Graphics();
    this.plantaHoverGraphics = new Graphics();
    this.dimensionText = new Text({
      text: "",
      style: { fontSize: 14, fill: 0x1f2937, fontFamily: "monospace" },
    });
    this.dimensionText.visible = false;

    // Cursor coordinate display
    this.cursorCoordBg = new Graphics();
    this.cursorCoordBg.visible = false;
    this.cursorCoordText = new Text({
      text: "",
      style: {
        fontSize: 11,
        fill: COLOR_COORD,
        fontFamily: "monospace",
        fontWeight: "bold",
      },
    });
    this.cursorCoordText.visible = false;

    // Corner labels
    this.cornerStartBg = new Graphics();
    this.cornerStartBg.visible = false;
    this.cornerStartText = new Text({
      text: "",
      style: {
        fontSize: 10,
        fill: COLOR_COORD,
        fontFamily: "monospace",
      },
    });
    this.cornerStartText.visible = false;

    this.cornerEndBg = new Graphics();
    this.cornerEndBg.visible = false;
    this.cornerEndText = new Text({
      text: "",
      style: {
        fontSize: 10,
        fill: COLOR_COORD,
        fontFamily: "monospace",
      },
    });
    this.cornerEndText.visible = false;

    this.container.addChild(this.selectionGraphics);
    this.container.addChild(this.snapGraphics);
    this.container.addChild(this.zonaPreviewGraphics);
    this.container.addChild(this.drawZonaGraphics);
    this.container.addChild(this.plantaPreviewGraphics);
    this.container.addChild(this.plantaHoverGraphics);
    this.container.addChild(this.dimensionText);
    this.container.addChild(this.cursorCoordBg);
    this.container.addChild(this.cursorCoordText);
    this.container.addChild(this.cornerStartBg);
    this.container.addChild(this.cornerStartText);
    this.container.addChild(this.cornerEndBg);
    this.container.addChild(this.cornerEndText);
  }

  drawSelectionRect(
    start: { x: number; y: number },
    current: { x: number; y: number },
    scale: number,
  ): void {
    const g = this.selectionGraphics;
    g.clear();

    const x = Math.min(start.x, current.x);
    const y = Math.min(start.y, current.y);
    const w = Math.abs(current.x - start.x);
    const h = Math.abs(current.y - start.y);

    g.rect(x, y, w, h);
    g.fill({ color: COLOR_SELECCION, alpha: 0.15 });
    g.rect(x, y, w, h);
    g.stroke({ color: COLOR_SELECCION, width: 2 / scale });
  }

  clearSelectionRect(): void {
    this.selectionGraphics.clear();
  }

  drawSnapGuides(
    verticalX: number | null,
    horizontalY: number | null,
    terrenoAncho: number,
    terrenoAlto: number,
    scale: number,
  ): void {
    const g = this.snapGraphics;
    g.clear();

    const maxW = terrenoAncho * PIXELS_POR_METRO;
    const maxH = terrenoAlto * PIXELS_POR_METRO;
    const lineWidth = 1.5 / scale;

    if (verticalX !== null) {
      const x = verticalX * PIXELS_POR_METRO;
      g.moveTo(x, 0).lineTo(x, maxH);
      g.stroke({ color: COLOR_SNAP, width: lineWidth, alpha: 0.8 });
    }

    if (horizontalY !== null) {
      const y = horizontalY * PIXELS_POR_METRO;
      g.moveTo(0, y).lineTo(maxW, y);
      g.stroke({ color: COLOR_SNAP, width: lineWidth, alpha: 0.8 });
    }
  }

  clearSnapGuides(): void {
    this.snapGraphics.clear();
  }

  drawZonaPreview(
    preview: {
      x: number;
      y: number;
      ancho: number;
      alto: number;
      esValida: boolean;
    },
    scale: number,
  ): void {
    const g = this.zonaPreviewGraphics;
    g.clear();

    const x = preview.x * PIXELS_POR_METRO;
    const y = preview.y * PIXELS_POR_METRO;
    const w = preview.ancho * PIXELS_POR_METRO;
    const h = preview.alto * PIXELS_POR_METRO;
    const color = preview.esValida
      ? COLOR_PREVIEW_VALIDA
      : COLOR_PREVIEW_INVALIDA;

    g.rect(x, y, w, h);
    g.fill({ color, alpha: 0.2 });
    g.rect(x, y, w, h);
    g.stroke({ color, width: 2 / scale });
  }

  clearZonaPreview(): void {
    this.zonaPreviewGraphics.clear();
  }

  /** Dibuja el rectángulo de zona mientras el usuario arrastra + dimensiones + coordenadas de esquinas */
  drawCreateZona(
    start: { x: number; y: number },
    current: { x: number; y: number },
    scale: number,
  ): void {
    const g = this.drawZonaGraphics;
    g.clear();

    const x = Math.min(start.x, current.x);
    const y = Math.min(start.y, current.y);
    const w = Math.abs(current.x - start.x);
    const h = Math.abs(current.y - start.y);

    g.rect(x, y, w, h);
    g.fill({ color: COLOR_PREVIEW_VALIDA, alpha: 0.2 });
    g.rect(x, y, w, h);
    g.stroke({ color: COLOR_PREVIEW_VALIDA, width: 2 / scale });

    const fontSize = Math.max(10, 14 / scale);
    const anchoM = (w / PIXELS_POR_METRO).toFixed(1);
    const altoM = (h / PIXELS_POR_METRO).toFixed(1);
    this.dimensionText.text = `${anchoM}m × ${altoM}m`;
    this.dimensionText.position.set(x + w / 2, y + h / 2);
    this.dimensionText.anchor.set(0.5);
    this.dimensionText.style.fontSize = fontSize;
    this.dimensionText.visible = true;

    // Esquina inicio (top-left del rect)
    const startM = `${(x / PIXELS_POR_METRO).toFixed(1)}, ${(y / PIXELS_POR_METRO).toFixed(1)}`;
    const cornerFontSize = Math.max(8, 10 / scale);
    this.drawCornerLabel(
      this.cornerStartBg,
      this.cornerStartText,
      startM,
      x,
      y,
      cornerFontSize,
      0.5,
      1,
    );

    // Esquina fin (bottom-right del rect)
    const endM = `${((x + w) / PIXELS_POR_METRO).toFixed(1)}, ${((y + h) / PIXELS_POR_METRO).toFixed(1)}`;
    this.drawCornerLabel(
      this.cornerEndBg,
      this.cornerEndText,
      endM,
      x + w,
      y + h,
      cornerFontSize,
      0.5,
      0,
    );
  }

  /** Muestra la posición del cursor en metros (X, Y) */
  drawCursorCoord(cursorXm: number, cursorYm: number, scale: number): void {
    const text = `X: ${cursorXm.toFixed(1)}m  Y: ${cursorYm.toFixed(1)}m`;
    const fontSize = Math.max(9, 11 / scale);
    const px = cursorXm * PIXELS_POR_METRO;
    const py = cursorYm * PIXELS_POR_METRO;
    const offsetY = -fontSize * 1.8;

    this.cursorCoordText.text = text;
    this.cursorCoordText.style.fontSize = fontSize;
    this.cursorCoordText.anchor.set(0.5, 1);
    this.cursorCoordText.position.set(px, py + offsetY);
    this.cursorCoordText.visible = true;

    const pad = fontSize * 0.3;
    const approxW = text.length * fontSize * 0.55 + pad * 2;
    const approxH = fontSize + pad * 2;
    this.cursorCoordBg.clear();
    this.cursorCoordBg.rect(-approxW / 2, -approxH, approxW, approxH);
    this.cursorCoordBg.fill({ color: COORD_BG_COLOR, alpha: COORD_BG_ALPHA });
    this.cursorCoordBg.position.set(px, py + offsetY);
    this.cursorCoordBg.visible = true;
  }

  clearCursorCoord(): void {
    this.cursorCoordText.visible = false;
    this.cursorCoordBg.visible = false;
  }

  clearCreateZona(): void {
    this.drawZonaGraphics.clear();
    this.dimensionText.visible = false;
    this.cornerStartText.visible = false;
    this.cornerStartBg.visible = false;
    this.cornerEndText.visible = false;
    this.cornerEndBg.visible = false;
  }

  drawPlantasPreview(
    plantasPreview: Map<string, { x: number; y: number }>,
    scale: number,
    radius: number = 5,
  ): void {
    const g = this.plantaPreviewGraphics;
    g.clear();

    for (const [, pos] of plantasPreview) {
      const px = pos.x * PIXELS_POR_METRO;
      const py = pos.y * PIXELS_POR_METRO;
      const r = Math.max(1.5 / scale, radius);

      g.circle(px, py, r);
      g.fill({ color: COLOR_HOVER, alpha: 0.6 });
      g.circle(px, py, r);
      g.stroke({ color: COLOR_HOVER, width: 1 / scale });
    }
  }

  clearPlantasPreview(): void {
    this.plantaPreviewGraphics.clear();
  }

  drawPlantaHover(x: number, y: number, radius: number, scale: number): void {
    const g = this.plantaHoverGraphics;
    g.clear();

    const r = Math.max(2 / scale, radius);
    g.circle(x, y, r);
    g.stroke({ color: 0xec4899, width: 2 / scale });
  }

  clearPlantaHover(): void {
    this.plantaHoverGraphics.clear();
  }

  clearAll(): void {
    this.clearSelectionRect();
    this.clearSnapGuides();
    this.clearZonaPreview();
    this.clearCreateZona();
    this.clearPlantasPreview();
    this.clearPlantaHover();
    this.clearCursorCoord();
  }

  destroy(): void {
    this.selectionGraphics.destroy();
    this.snapGraphics.destroy();
    this.zonaPreviewGraphics.destroy();
    this.drawZonaGraphics.destroy();
    this.plantaPreviewGraphics.destroy();
    this.plantaHoverGraphics.destroy();
    this.dimensionText.destroy();
    this.cursorCoordBg.destroy();
    this.cursorCoordText.destroy();
    this.cornerStartBg.destroy();
    this.cornerStartText.destroy();
    this.cornerEndBg.destroy();
    this.cornerEndText.destroy();
    this.container.destroy();
  }

  private drawCornerLabel(
    bg: Graphics,
    text: Text,
    label: string,
    px: number,
    py: number,
    fontSize: number,
    anchorX: number,
    anchorY: number,
  ): void {
    text.text = label;
    text.style.fontSize = fontSize;
    text.anchor.set(anchorX, anchorY);
    text.position.set(px, py);
    text.visible = true;

    const pad = fontSize * 0.3;
    const approxW = label.length * fontSize * 0.55 + pad * 2;
    const approxH = fontSize + pad * 2;
    bg.clear();
    const bgX = px - approxW * anchorX;
    const bgY = py - approxH * anchorY;
    bg.rect(bgX, bgY, approxW, approxH);
    bg.fill({ color: COORD_BG_COLOR, alpha: COORD_BG_ALPHA });
    bg.visible = true;
  }
}
