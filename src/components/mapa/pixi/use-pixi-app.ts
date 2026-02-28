"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { Application } from "pixi.js";
import { BG_COLOR } from "./pixi-constants";

export function usePixiApp(containerRef: RefObject<HTMLDivElement | null>): {
  app: Application | null;
  isReady: boolean;
} {
  const appRef = useRef<Application | null>(null);
  const [isReady, setIsReady] = useState(false);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let destroyed = false;
    const app = new Application();

    const init = async () => {
      const rect = container.getBoundingClientRect();

      await app.init({
        width: rect.width || 800,
        height: rect.height || 600,
        backgroundColor: BG_COLOR,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        preference: "webgl",
      });

      if (destroyed) {
        app.destroy(true, { children: true });
        return;
      }

      app.stage.eventMode = "static";
      app.stage.hitArea = app.screen;

      container.appendChild(app.canvas as HTMLCanvasElement);
      appRef.current = app;

      resizeObserverRef.current = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            app.renderer.resize(width, height);
            app.stage.hitArea = app.screen;
          }
        }
      });
      resizeObserverRef.current.observe(container);

      setIsReady(true);
    };

    init();

    return () => {
      destroyed = true;
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;

      if (appRef.current) {
        const canvas = appRef.current.canvas as HTMLCanvasElement;
        if (canvas.parentNode) {
          canvas.parentNode.removeChild(canvas);
        }
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
      }
      setIsReady(false);
    };
  }, [containerRef]);

  // eslint-disable-next-line react-hooks/refs -- lectura de ref en retorno del hook, no durante render del componente; patrón válido para librerías imperativas
  return { app: appRef.current, isReady };
}
