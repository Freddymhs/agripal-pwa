import { Container, Graphics } from 'pixi.js'
import { PIXELS_POR_METRO } from './pixi-constants'

export class PixiGridLayer {
  container: Container
  private grid1m: Graphics
  private grid5m: Graphics

  constructor() {
    this.container = new Container()
    this.grid1m = new Graphics()
    this.grid5m = new Graphics()
    this.container.addChild(this.grid1m)
    this.container.addChild(this.grid5m)
  }

  build(anchoMetros: number, altoMetros: number): void {
    const w = anchoMetros * PIXELS_POR_METRO
    const h = altoMetros * PIXELS_POR_METRO
    const step1m = PIXELS_POR_METRO
    const step5m = PIXELS_POR_METRO * 5

    this.grid1m.clear()
    for (let x = 0; x <= w; x += step1m) {
      this.grid1m.moveTo(x, 0).lineTo(x, h)
    }
    for (let y = 0; y <= h; y += step1m) {
      this.grid1m.moveTo(0, y).lineTo(w, y)
    }
    this.grid1m.stroke({ color: 0x9ca3af, width: 0.5, alpha: 0.1 })

    this.grid5m.clear()
    for (let x = 0; x <= w; x += step5m) {
      this.grid5m.moveTo(x, 0).lineTo(x, h)
    }
    for (let y = 0; y <= h; y += step5m) {
      this.grid5m.moveTo(0, y).lineTo(w, y)
    }
    this.grid5m.stroke({ color: 0x9ca3af, width: 1, alpha: 0.2 })
  }

  destroy(): void {
    this.grid1m.destroy()
    this.grid5m.destroy()
    this.container.destroy()
  }
}
