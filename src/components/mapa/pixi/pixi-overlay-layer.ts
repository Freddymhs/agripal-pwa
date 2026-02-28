import { Container, Graphics, Text } from "pixi.js";
import {
  PIXELS_POR_METRO,
  COLOR_SELECCION,
  COLOR_SNAP,
  COLOR_PREVIEW_VALIDA,
  COLOR_PREVIEW_INVALIDA,
  COLOR_HOVER,
} from "./pixi-constants";

export class PixiOverlayLayer {
  container: Container;
  private selectionGraphics: Graphics;
  private snapGraphics: Graphics;
  private zonaPreviewGraphics: Graphics;
  private drawZonaGraphics: Graphics;
  private plantaPreviewGraphics: Graphics;
  private plantaHoverGraphics: Graphics;
  private dimensionText: Text;

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

    this.container.addChild(this.selectionGraphics);
    this.container.addChild(this.snapGraphics);
    this.container.addChild(this.zonaPreviewGraphics);
    this.container.addChild(this.drawZonaGraphics);
    this.container.addChild(this.plantaPreviewGraphics);
    this.container.addChild(this.plantaHoverGraphics);
    this.container.addChild(this.dimensionText);
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

    const anchoM = (w / PIXELS_POR_METRO).toFixed(1);
    const altoM = (h / PIXELS_POR_METRO).toFixed(1);
    this.dimensionText.text = `${anchoM}m x ${altoM}m`;
    this.dimensionText.position.set(x + w / 2, y + h / 2);
    this.dimensionText.anchor.set(0.5);
    this.dimensionText.style.fontSize = Math.max(10, 14 / scale);
    this.dimensionText.visible = true;
  }

  clearCreateZona(): void {
    this.drawZonaGraphics.clear();
    this.dimensionText.visible = false;
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
  }

  destroy(): void {
    this.selectionGraphics.destroy();
    this.snapGraphics.destroy();
    this.zonaPreviewGraphics.destroy();
    this.drawZonaGraphics.destroy();
    this.plantaPreviewGraphics.destroy();
    this.plantaHoverGraphics.destroy();
    this.dimensionText.destroy();
    this.container.destroy();
  }
}
