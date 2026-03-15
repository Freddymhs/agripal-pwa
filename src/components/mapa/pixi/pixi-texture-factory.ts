import { Graphics, Texture, type Renderer } from "pixi.js";
import { ESTADO_PLANTA } from "@/lib/constants/entities";

export class PixiTextureFactory {
  private static readonly KEY_NORMAL = "normal";
  private static readonly KEY_SELECTED = "selected";
  private static readonly KEY_MUERTA = ESTADO_PLANTA.MUERTA;
  private static readonly KEY_MUERTA_SELECTED = `${ESTADO_PLANTA.MUERTA}-selected`;

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
      PixiTextureFactory.KEY_NORMAL,
      createTexture((g) => {
        g.circle(size / 2, size / 2, size / 2 - 2);
        g.fill(0xffffff);
      }),
    );

    this.textures.set(
      PixiTextureFactory.KEY_MUERTA,
      createTexture((g) => {
        g.circle(size / 2, size / 2, size / 2 - 2);
        g.fill(0xffffff);
        g.moveTo(size * 0.25, size * 0.25).lineTo(size * 0.75, size * 0.75);
        g.moveTo(size * 0.75, size * 0.25).lineTo(size * 0.25, size * 0.75);
        g.stroke({ color: 0xffffff, width: 2 });
      }),
    );

    this.textures.set(
      PixiTextureFactory.KEY_SELECTED,
      createTexture((g) => {
        g.circle(size / 2, size / 2, size / 2 - 2);
        g.fill(0xffffff);
        g.circle(size / 2, size / 2, size / 2 - 1);
        g.stroke({ color: 0x3b82f6, width: 2 });
      }),
    );

    this.textures.set(
      PixiTextureFactory.KEY_MUERTA_SELECTED,
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
      return this.textures.get(PixiTextureFactory.KEY_MUERTA_SELECTED)!;
    if (estado === ESTADO_PLANTA.MUERTA)
      return this.textures.get(PixiTextureFactory.KEY_MUERTA)!;
    if (isSelected) return this.textures.get(PixiTextureFactory.KEY_SELECTED)!;
    return this.textures.get(PixiTextureFactory.KEY_NORMAL)!;
  }

  destroy(): void {
    this.textures.forEach((t) => t.destroy(true));
    this.textures.clear();
  }
}
