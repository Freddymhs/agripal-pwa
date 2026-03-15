import { Container, Graphics, Text } from "pixi.js";
import { PIXELS_POR_METRO, COLORES_ZONA_HEX } from "./pixi-constants";
import type { Zona } from "@/types";
import { TIPO_ZONA } from "@/lib/constants/entities";

const COLOR_ZONA_HOVER = 0xfbbf24;

function buildEstanqueLabel(zona: Zona): string {
  if (zona.tipo === TIPO_ZONA.ESTANQUE && zona.estanque_config) {
    const cfg = zona.estanque_config;
    const pct =
      cfg.capacidad_m3 > 0
        ? Math.round((cfg.nivel_actual_m3 / cfg.capacidad_m3) * 100)
        : 0;
    return `${zona.nombre}\n${pct}%`;
  }
  return zona.nombre;
}

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
    modoPlano: boolean = false,
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
        const zoneHpx = zona.alto * PIXELS_POR_METRO;
        const pad = Math.max(2, zoneHpx * 0.06);

        // Font del nombre: usa ~55% de la altura disponible (1 línea)
        const maxNameFont = (zoneHpx * 0.55) / 1.35;
        const baseFontSize = showMiniLabel
          ? Math.max(8, 12 / scale)
          : Math.max(10, 14 / scale);
        const nameFont = Math.min(baseFontSize, Math.max(9, maxNameFont));

        // Nombre: arriba-izquierda (estanques muestran también el % de nivel)
        const nameText = new Text({
          text: buildEstanqueLabel(zona),
          style: {
            fontSize: nameFont,
            fill: modoPlano ? 0x111827 : 0x1f2937,
            fontFamily: modoPlano ? "monospace" : "sans-serif",
            fontWeight: modoPlano ? "bold" : "normal",
          },
        });
        nameText.position.set(x + pad, y + pad);
        nameText.anchor.set(0, 0);
        this.container.addChild(nameText);
        this.zonaLabels.set(zona.id, nameText);

        // Dimensiones + área: abajo-izquierda, font más pequeño
        // Zonas bajas (< 8m): 1 línea para evitar solapamiento con el nombre
        if (modoPlano && showLabel) {
          const dimsFont = Math.max(8, nameFont * 0.88);
          const areaM2 = zona.ancho * zona.alto;
          const isShortHeight = zona.alto < 8;
          const dimsStr = isShortHeight
            ? `${zona.ancho}×${zona.alto}m · ${areaM2}m²`
            : `${zona.ancho}×${zona.alto}m\n${areaM2}m²`;
          const dimsText = new Text({
            text: dimsStr,
            style: {
              fontSize: dimsFont,
              fill: 0x374151,
              fontFamily: "monospace",
              fontWeight: "normal",
              align: "left",
            },
          });
          dimsText.position.set(x + pad, y + h - pad);
          dimsText.anchor.set(0, 1);
          this.container.addChild(dimsText);
          this.zonaLabels.set(`${zona.id}_dims`, dimsText);
        }
      }
    }

    this.container.addChild(this.hoverGraphics);
  }

  clear(): void {
    // Remover hoverGraphics ANTES de removeChildren() para que no sea destruido
    if (
      this.hoverGraphics &&
      this.container.children.includes(this.hoverGraphics)
    ) {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PixiJS `destroyed` existe en runtime pero no está en los tipos públicos
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
