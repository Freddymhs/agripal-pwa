import { Container, Graphics, Text } from "pixi.js";
import { PIXELS_POR_METRO, COLORES_ZONA_HEX } from "./pixi-constants";
import type { Zona } from "@/types";
import { TIPO_ZONA } from "@/lib/constants/entities";

const COLOR_ZONA_HOVER = 0xfbbf24;

export class PixiZonasLayer {
  container: Container;
  private zonaGraphics: Map<string, Graphics> = new Map();
  private zonaLabels: Map<string, Text> = new Map();
  private hoverGraphics: Graphics;

  constructor() {
    this.container = new Container();
    this.hoverGraphics = new Graphics();
  }

  build(
    zonas: Zona[],
    zonaSeleccionadaId: string | null,
    scale: number,
    onZonaClick: (zona: Zona) => void,
    zonaCultivoColor: Record<string, number | null> = {},
    zonasInteractivas: boolean = true,
  ): void {
    this.clear();

    for (const zona of zonas) {
      const g = new Graphics();
      const x = zona.x * PIXELS_POR_METRO;
      const y = zona.y * PIXELS_POR_METRO;
      const w = zona.ancho * PIXELS_POR_METRO;
      const h = zona.alto * PIXELS_POR_METRO;
      const cultivoColor = zonaCultivoColor[zona.id];
      const colorHex = cultivoColor ?? COLORES_ZONA_HEX[zona.tipo] ?? 0x374151;

      if (zona.tipo === TIPO_ZONA.ESTANQUE && zona.estanque_config) {
        g.rect(x, y, w, h);
        g.fill({ color: colorHex, alpha: 0.3 });

        const cfg = zona.estanque_config;
        const porcentaje =
          cfg.capacidad_m3 > 0
            ? (cfg.nivel_actual_m3 / cfg.capacidad_m3) * 100
            : 0;
        const fillH = h * (porcentaje / 100);
        if (fillH > 0) {
          g.rect(x, y + h - fillH, w, fillH);
          g.fill({ color: 0x06b6d4, alpha: 0.3 + 0.5 * (porcentaje / 100) });
        }
      } else {
        g.rect(x, y, w, h);
        g.fill({ color: colorHex, alpha: 0.5 });
      }

      g.rect(x, y, w, h);
      g.stroke({
        color: colorHex,
        width: zona.id === zonaSeleccionadaId ? 3 : 1,
      });

      if (zona.id === zonaSeleccionadaId) {
        g.rect(x, y, w, h);
        g.stroke({ color: 0x000000, width: 2 });
      }

      if (zonasInteractivas) {
        g.eventMode = "static";
        g.cursor = "pointer";
        g.hitArea = {
          contains: (px: number, py: number) =>
            px >= x && px <= x + w && py >= y && py <= y + h,
        };
        g.on("pointertap", () => {
          onZonaClick(zona);
        });
        g.on("pointerover", () => {
          this.hoverGraphics?.clear();
          this.hoverGraphics?.rect(x, y, w, h);
          this.hoverGraphics?.stroke({ color: COLOR_ZONA_HOVER, width: 3 });
        });
        g.on("pointerout", () => {
          this.hoverGraphics?.clear();
        });
      } else {
        g.eventMode = "none";
      }

      this.container.addChild(g);
      this.zonaGraphics.set(zona.id, g);

      const areaM2 = zona.ancho * zona.alto;
      const showLabel = scale < 5 && areaM2 >= 10;
      const showMiniLabel = scale < 8 && areaM2 < 10;

      if (showLabel || showMiniLabel) {
        const fontSize = showMiniLabel
          ? Math.max(8, 12 / scale)
          : Math.max(10, 14 / scale);

        let labelText = zona.nombre;
        if (zona.tipo === TIPO_ZONA.ESTANQUE && zona.estanque_config) {
          const cfg = zona.estanque_config;
          const pct =
            cfg.capacidad_m3 > 0
              ? Math.round((cfg.nivel_actual_m3 / cfg.capacidad_m3) * 100)
              : 0;
          labelText = `${zona.nombre}\n${pct}%`;
        }

        const text = new Text({
          text: labelText,
          style: {
            fontSize,
            fill: 0x1f2937,
            fontFamily: "sans-serif",
            align: "center",
          },
        });
        text.position.set(x + w / 2, y + h / 2);
        text.anchor.set(0.5);
        this.container.addChild(text);
        this.zonaLabels.set(zona.id, text);
      }
    }

    this.container.addChild(this.hoverGraphics);
  }

  clear(): void {
    // Remover hoverGraphics ANTES de removeChildren() para que no sea destruido
    if (this.hoverGraphics && this.container.children.includes(this.hoverGraphics)) {
      this.container.removeChild(this.hoverGraphics);
    }

    this.container.removeChildren();
    this.zonaGraphics.forEach((g) => {
      g.off("pointertap");
      g.off("pointerover");
      g.off("pointerout");
      g.destroy();
    });
    this.zonaLabels.forEach((t) => t.destroy());
    this.zonaGraphics.clear();
    this.zonaLabels.clear();

    // Recrear hoverGraphics si fue destruido
    // any: PixiJS `destroyed` property exists at runtime but is not in public types
    if (!this.hoverGraphics || (this.hoverGraphics as any).destroyed) {
      this.hoverGraphics = new Graphics();
    } else {
      this.hoverGraphics.clear();
    }
  }

  destroy(): void {
    this.clear();
    this.hoverGraphics?.destroy();
    this.container.destroy();
  }
}
