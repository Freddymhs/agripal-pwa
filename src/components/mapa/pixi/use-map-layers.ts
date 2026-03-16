import { useEffect, useRef, useMemo, type MutableRefObject } from "react";
import { Application, Container, Graphics } from "pixi.js";
import { PixiGridLayer } from "./pixi-grid-layer";
import { PixiZonasLayer } from "./pixi-zonas-layer";
import { PixiTextureFactory } from "./pixi-texture-factory";
import { PixiPlantasLayer } from "./pixi-plantas-layer";
import { PixiHitTest } from "./pixi-hit-test";
import { PixiOverlayLayer } from "./pixi-overlay-layer";
import { PixiSpacingLayer } from "./pixi-spacing-layer";
import { PixiCursorGuidesLayer } from "./pixi-cursor-guides-layer";
import { PIXELS_POR_METRO, COLOR_BORDE_TERRENO } from "./pixi-constants";
import type { Terreno, Zona, Planta } from "@/types";
import { MODO, TIPO_ZONA } from "@/lib/constants/entities";

interface LayerRefs {
  worldRef: MutableRefObject<Container | null>;
  gridLayerRef: MutableRefObject<PixiGridLayer | null>;
  zonasLayerRef: MutableRefObject<PixiZonasLayer | null>;
  textureFactoryRef: MutableRefObject<PixiTextureFactory | null>;
  plantasLayerRef: MutableRefObject<PixiPlantasLayer | null>;
  hitTestRef: MutableRefObject<PixiHitTest | null>;
  overlayLayerRef: MutableRefObject<PixiOverlayLayer | null>;
  spacingLayerRef: MutableRefObject<PixiSpacingLayer | null>;
  cursorGuidesLayerRef: MutableRefObject<PixiCursorGuidesLayer | null>;
  borderRef: MutableRefObject<Graphics | null>;
}

interface LayerProps {
  terreno: Terreno;
  zonas: Zona[];
  plantas: Planta[];
  zonaSeleccionadaId?: string | null;
  cultivosEspaciado: Record<string, number>;
  cultivosColores: Record<string, number>;
  plantasSeleccionadasIds: string[];
  modo: string;
  zonaPreview?: {
    x: number;
    y: number;
    ancho: number;
    alto: number;
    esValida: boolean;
  } | null;
  onZonaClick?: (zona: Zona) => void;
}

interface LayerPropsRef {
  plantas: Planta[];
  zonas: Zona[];
  cultivosEspaciado: Record<string, number>;
}

export function useMapLayers(
  app: Application | null,
  refs: LayerRefs,
  props: LayerProps,
  propsRef: MutableRefObject<LayerPropsRef>,
  viewport: { getScale: () => number; fitView: (w: number, h: number) => void },
) {
  const {
    worldRef,
    gridLayerRef,
    zonasLayerRef,
    textureFactoryRef,
    plantasLayerRef,
    hitTestRef,
    overlayLayerRef,
    spacingLayerRef,
    cursorGuidesLayerRef,
    borderRef,
  } = refs;

  const {
    terreno,
    zonas,
    plantas,
    zonaSeleccionadaId,
    cultivosEspaciado,
    cultivosColores,
    plantasSeleccionadasIds,
    modo,
    zonaPreview,
    onZonaClick,
  } = props;

  useEffect(() => {
    if (!app) return;
    const world = new Container();
    app.stage.addChild(world);
    worldRef.current = world;
    return () => {
      app.stage?.removeChild(world);
      world.destroy({ children: true });
      worldRef.current = null;
    };
  }, [app, worldRef]);

  const initialFitDoneRef = useRef(false);

  useEffect(() => {
    if (!app || !worldRef.current || initialFitDoneRef.current) return;
    const worldW = terreno.ancho_m * PIXELS_POR_METRO;
    const worldH = terreno.alto_m * PIXELS_POR_METRO;
    viewport.fitView(worldW, worldH);
    initialFitDoneRef.current = true;
  }, [app, terreno.ancho_m, terreno.alto_m, viewport, worldRef]);

  useEffect(() => {
    if (!worldRef.current || !app) return;

    const border = new Graphics();
    const w = terreno.ancho_m * PIXELS_POR_METRO;
    const h = terreno.alto_m * PIXELS_POR_METRO;
    border.rect(0, 0, w, h);
    border.stroke({ color: COLOR_BORDE_TERRENO, width: 2 });
    worldRef.current.addChild(border);
    borderRef.current = border;

    return () => {
      worldRef.current?.removeChild(border);
      border.destroy();
      borderRef.current = null;
    };
  }, [terreno.ancho_m, terreno.alto_m, app, worldRef, borderRef]);

  useEffect(() => {
    if (!worldRef.current || !app) return;

    const grid = new PixiGridLayer();
    grid.build(terreno.ancho_m, terreno.alto_m);
    worldRef.current.addChildAt(grid.container, 0);
    gridLayerRef.current = grid;

    const zonasLayer = new PixiZonasLayer();
    worldRef.current.addChild(zonasLayer.container);
    zonasLayerRef.current = zonasLayer;

    const hitTest = new PixiHitTest();
    hitTestRef.current = hitTest;
    hitTest.rebuild(
      propsRef.current.plantas,
      propsRef.current.zonas,
      propsRef.current.cultivosEspaciado,
    );

    const spacingLayer = new PixiSpacingLayer();
    worldRef.current.addChild(spacingLayer.container);
    spacingLayerRef.current = spacingLayer;

    const cursorGuidesLayer = new PixiCursorGuidesLayer();
    worldRef.current.addChild(cursorGuidesLayer.container);
    cursorGuidesLayerRef.current = cursorGuidesLayer;

    const overlay = new PixiOverlayLayer();
    worldRef.current.addChild(overlay.container);
    overlayLayerRef.current = overlay;

    return () => {
      try {
        grid.destroy();
        zonasLayer.destroy();
        hitTest.destroy();
        spacingLayer.destroy();
        cursorGuidesLayer.destroy();
        overlay.destroy();
      } catch {
        // PixiJS objects may already be destroyed during navigation unmount
      }
      gridLayerRef.current = null;
      zonasLayerRef.current = null;
      hitTestRef.current = null;
      spacingLayerRef.current = null;
      cursorGuidesLayerRef.current = null;
      overlayLayerRef.current = null;
    };
  }, [
    app,
    terreno.ancho_m,
    terreno.alto_m,
    worldRef,
    gridLayerRef,
    zonasLayerRef,
    hitTestRef,
    spacingLayerRef,
    cursorGuidesLayerRef,
    overlayLayerRef,
    propsRef,
  ]);

  useEffect(() => {
    if (!app || !worldRef.current) return;

    const factory = new PixiTextureFactory();
    let cancelled = false;

    factory.init(app.renderer).then(() => {
      if (cancelled) {
        factory.destroy();
        return;
      }
      textureFactoryRef.current = factory;

      const layer = new PixiPlantasLayer(factory);
      worldRef.current?.addChild(layer.container);

      if (overlayLayerRef.current) {
        worldRef.current?.removeChild(overlayLayerRef.current.container);
        worldRef.current?.addChild(overlayLayerRef.current.container);
      }

      plantasLayerRef.current = layer;
    });

    return () => {
      cancelled = true;
      try {
        if (plantasLayerRef.current) {
          worldRef.current?.removeChild(plantasLayerRef.current.container);
          plantasLayerRef.current.destroy();
          plantasLayerRef.current = null;
        }
        factory.destroy();
      } catch {
        // PixiJS objects may already be destroyed during navigation unmount
      }
      textureFactoryRef.current = null;
    };
  }, [app, worldRef, textureFactoryRef, plantasLayerRef, overlayLayerRef]);

  const zonaCultivoColor = useMemo(() => {
    const map: Record<string, number | null> = {};
    for (const zona of zonas) {
      if (zona.tipo !== TIPO_ZONA.CULTIVO) continue;
      const plantasZona = plantas.filter((p) => p.zona_id === zona.id);
      if (plantasZona.length === 0) continue;
      const tipos = new Set(plantasZona.map((p) => p.tipo_cultivo_id));
      if (tipos.size === 1) {
        const tipoId = [...tipos][0];
        map[zona.id] = cultivosColores[tipoId] ?? null;
      }
    }
    return map;
  }, [zonas, plantas, cultivosColores]);

  const zonaEstanqueLabels = useMemo(() => {
    const labels = new Map<string, string>();
    const estanques = zonas.filter((z) => z.tipo === TIPO_ZONA.ESTANQUE);
    if (estanques.length < 2) return labels;

    const shortNames = new Map<string, string>();
    estanques.forEach((est, i) => {
      shortNames.set(est.id, `e${i + 1}`);
    });

    for (const zona of zonas) {
      if (zona.tipo !== TIPO_ZONA.CULTIVO || !zona.estanque_id) continue;
      const short = shortNames.get(zona.estanque_id);
      if (short) labels.set(zona.id, short);
    }
    return labels;
  }, [zonas]);

  useEffect(() => {
    if (!zonasLayerRef.current) return;
    const zonasInteractivas = modo === MODO.ZONAS || modo === MODO.PLANTAR;
    const modoPlano = modo === MODO.ESPACIADO;
    zonasLayerRef.current.build(
      zonas,
      zonaSeleccionadaId || null,
      viewport.getScale(),
      (zona) => onZonaClick?.(zona),
      zonaCultivoColor,
      zonasInteractivas,
      modoPlano,
      zonaEstanqueLabels,
    );
  }, [
    zonas,
    zonaSeleccionadaId,
    viewport,
    zonaCultivoColor,
    modo,
    zonasLayerRef,
    onZonaClick,
    zonaEstanqueLabels,
  ]);

  useEffect(() => {
    if (!plantasLayerRef.current) return;
    const selSet = new Set(plantasSeleccionadasIds);
    plantasLayerRef.current.rebuild(
      plantas,
      zonas,
      cultivosEspaciado,
      cultivosColores,
      selSet,
      viewport.getScale(),
    );
  }, [
    plantas,
    zonas,
    cultivosEspaciado,
    cultivosColores,
    viewport,
    plantasLayerRef,
    plantasSeleccionadasIds,
  ]);

  useEffect(() => {
    if (!plantasLayerRef.current) return;
    const selSet = new Set(plantasSeleccionadasIds);
    plantasLayerRef.current.updateSelection(selSet, plantas);
  }, [plantasSeleccionadasIds, plantas, plantasLayerRef]);

  useEffect(() => {
    if (!hitTestRef.current) return;
    hitTestRef.current.rebuild(plantas, zonas, cultivosEspaciado);
  }, [plantas, zonas, cultivosEspaciado, hitTestRef]);

  useEffect(() => {
    if (modo !== MODO.PLANTAR) {
      overlayLayerRef.current?.clearPlantasPreview();
    }
    if (modo !== MODO.PLANTAS) {
      overlayLayerRef.current?.clearPlantaHover();
    }
  }, [modo, zonaSeleccionadaId, overlayLayerRef]);

  // En modo plano, reducir opacidad de plantas para que no tapen los labels técnicos
  useEffect(() => {
    if (!plantasLayerRef.current) return;
    const OPACIDAD_PLANO = 0.15;
    plantasLayerRef.current.container.alpha =
      modo === MODO.ESPACIADO ? OPACIDAD_PLANO : 1;
  }, [modo, plantasLayerRef]);

  useEffect(() => {
    if (!overlayLayerRef.current) return;
    if (zonaPreview) {
      overlayLayerRef.current.drawZonaPreview(
        {
          x: zonaPreview.x,
          y: zonaPreview.y,
          ancho: zonaPreview.ancho,
          alto: zonaPreview.alto,
          esValida: zonaPreview.esValida,
        },
        viewport.getScale(),
      );
    } else {
      overlayLayerRef.current.clearZonaPreview();
    }
  }, [zonaPreview, viewport, overlayLayerRef]);

  useEffect(() => {
    if (!spacingLayerRef.current) return;
    if (modo === MODO.ESPACIADO) {
      spacingLayerRef.current.build(zonas, terreno, viewport.getScale());
    } else {
      spacingLayerRef.current.clear();
    }
  }, [modo, zonas, terreno, viewport, spacingLayerRef]);

  // Limpiar cursor guides cuando se sale del modo crear_zona
  useEffect(() => {
    if (modo !== MODO.CREAR_ZONA) {
      cursorGuidesLayerRef.current?.clear();
    }
  }, [modo, cursorGuidesLayerRef]);
}
