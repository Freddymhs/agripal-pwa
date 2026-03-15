import { Container, Graphics, Text } from "pixi.js";
import { PIXELS_POR_METRO } from "./pixi-constants";

const COLOR_GRID = 0x9ca3af;
const COLOR_RULER = 0x64748b;
const RULER_INTERVAL_M = 5;
const RULER_FONT_SIZE = 9;
const RULER_OFFSET_PX = 2;

export class PixiGridLayer {
  container: Container;
  private grid1m: Graphics;
  private grid5m: Graphics;
  private rulerLabels: Text[] = [];

  constructor() {
    this.container = new Container();
    this.grid1m = new Graphics();
    this.grid5m = new Graphics();
    this.container.addChild(this.grid1m);
    this.container.addChild(this.grid5m);
  }

  build(anchoMetros: number, altoMetros: number): void {
    const w = anchoMetros * PIXELS_POR_METRO;
    const h = altoMetros * PIXELS_POR_METRO;
    const step1m = PIXELS_POR_METRO;
    const step5m = PIXELS_POR_METRO * RULER_INTERVAL_M;

    // Grid 1m
    this.grid1m.clear();
    for (let x = 0; x <= w; x += step1m) {
      this.grid1m.moveTo(x, 0).lineTo(x, h);
    }
    for (let y = 0; y <= h; y += step1m) {
      this.grid1m.moveTo(0, y).lineTo(w, y);
    }
    this.grid1m.stroke({ color: COLOR_GRID, width: 0.5, alpha: 0.1 });

    // Grid 5m
    this.grid5m.clear();
    for (let x = 0; x <= w; x += step5m) {
      this.grid5m.moveTo(x, 0).lineTo(x, h);
    }
    for (let y = 0; y <= h; y += step5m) {
      this.grid5m.moveTo(0, y).lineTo(w, y);
    }
    this.grid5m.stroke({ color: COLOR_GRID, width: 1, alpha: 0.2 });

    // Ruler labels cada 5m en borde superior e izquierdo
    this.clearLabels();

    // Horizontal (borde superior)
    for (let m = 0; m <= anchoMetros; m += RULER_INTERVAL_M) {
      const label = new Text({
        text: `${m}`,
        style: {
          fontSize: RULER_FONT_SIZE,
          fill: COLOR_RULER,
          fontFamily: "monospace",
        },
      });
      label.anchor.set(0.5, 0);
      label.position.set(
        m * PIXELS_POR_METRO,
        -RULER_FONT_SIZE - RULER_OFFSET_PX,
      );
      this.container.addChild(label);
      this.rulerLabels.push(label);
    }

    // Vertical (borde izquierdo)
    for (let m = RULER_INTERVAL_M; m <= altoMetros; m += RULER_INTERVAL_M) {
      const label = new Text({
        text: `${m}`,
        style: {
          fontSize: RULER_FONT_SIZE,
          fill: COLOR_RULER,
          fontFamily: "monospace",
        },
      });
      label.anchor.set(1, 0.5);
      label.position.set(-RULER_OFFSET_PX, m * PIXELS_POR_METRO);
      this.container.addChild(label);
      this.rulerLabels.push(label);
    }
  }

  private clearLabels(): void {
    for (const label of this.rulerLabels) {
      if (!label.destroyed) label.destroy();
    }
    this.rulerLabels = [];
  }

  destroy(): void {
    this.clearLabels();
    this.grid1m.destroy();
    this.grid5m.destroy();
    this.container.destroy();
  }
}
