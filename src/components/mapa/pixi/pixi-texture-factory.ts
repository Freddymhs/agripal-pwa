import { Graphics, Texture, type Renderer } from "pixi.js";
import { ESTADO_PLANTA } from "@/lib/constants/entities";

export class PixiTextureFactory {
  private textures: Map<string, Texture> = new Map();

  async init(renderer: Renderer): Promise<void> {
    const size = 32;

    const createTexture = (drawFn: (g: Graphics) => void): Texture => {
      const g = new Graphics();
      drawFn(g);
      const tex = renderer.generateTexture(g);
      g.destroy();
      return tex;
    };

    this.textures.set(
      "normal",
      createTexture((g) => {
        g.circle(size / 2, size / 2, size / 2 - 2);
        g.fill(0xffffff);
      }),
    );

    this.textures.set(
      "muerta",
      createTexture((g) => {
        g.circle(size / 2, size / 2, size / 2 - 2);
        g.fill(0xffffff);
        g.moveTo(size * 0.25, size * 0.25).lineTo(size * 0.75, size * 0.75);
        g.moveTo(size * 0.75, size * 0.25).lineTo(size * 0.25, size * 0.75);
        g.stroke({ color: 0xffffff, width: 2 });
      }),
    );

    this.textures.set(
      "selected",
      createTexture((g) => {
        g.circle(size / 2, size / 2, size / 2 - 2);
        g.fill(0xffffff);
        g.circle(size / 2, size / 2, size / 2 - 1);
        g.stroke({ color: 0x3b82f6, width: 2 });
      }),
    );

    this.textures.set(
      "muerta-selected",
      createTexture((g) => {
        g.circle(size / 2, size / 2, size / 2 - 2);
        g.fill(0xffffff);
        g.moveTo(size * 0.25, size * 0.25).lineTo(size * 0.75, size * 0.75);
        g.moveTo(size * 0.75, size * 0.25).lineTo(size * 0.25, size * 0.75);
        g.stroke({ color: 0xffffff, width: 2 });
        g.circle(size / 2, size / 2, size / 2 - 1);
        g.stroke({ color: 0x3b82f6, width: 2 });
      }),
    );
  }

  getTexture(estado: string, isSelected: boolean): Texture {
    if (estado === ESTADO_PLANTA.MUERTA && isSelected)
      return this.textures.get("muerta-selected")!;
    if (estado === ESTADO_PLANTA.MUERTA) return this.textures.get("muerta")!;
    if (isSelected) return this.textures.get("selected")!;
    return this.textures.get("normal")!;
  }

  destroy(): void {
    this.textures.forEach((t) => t.destroy(true));
    this.textures.clear();
  }
}
