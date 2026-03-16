"use client";

import { useState, useCallback } from "react";
import type { DatosClimaticos } from "@/lib/data/clima";
import { useProjectContext } from "@/contexts/project-context";
import {
  generarInformePDF,
  generarPaqueteIA,
  generarExportPlano,
  logExportError,
} from "@/lib/utils/generar-informe-pdf";
import type { Terreno, Zona, Planta } from "@/types";

interface InformeExportPanelProps {
  terreno: Terreno;
  zonas: Zona[];
  plantas: Planta[];
  onExportarPNG: () => Promise<void>;
  onExtraerMapa: () => Promise<string>;
}

type ExportState = "idle" | "generating" | "done" | "copied" | "plano_copied";

export function InformeExportPanel({
  terreno,
  zonas,
  plantas,
  onExportarPNG,
  onExtraerMapa,
}: InformeExportPanelProps) {
  const { catalogoCultivos, alertasHook, datosBaseHook, proyectoActual } =
    useProjectContext();
  const [estado, setEstado] = useState<ExportState>("idle");

  const climaDatos = datosBaseHook?.datosBase?.clima?.[0] as
    | DatosClimaticos
    | undefined;

  const handleExportarPDF = useCallback(async () => {
    if (!climaDatos) {
      logExportError(
        "generarInformePDF",
        new Error("No hay datos climaticos en el proyecto"),
      );
      return;
    }
    setEstado("generating");
    try {
      const mapaImageDataUrl = await onExtraerMapa();
      generarInformePDF({
        terreno,
        zonas,
        plantas,
        catalogoCultivos,
        alertas: alertasHook.alertas,
        mapaImageDataUrl,
        clima: climaDatos,
        suelo: proyectoActual?.suelo,
      });
      setEstado("done");
      setTimeout(() => setEstado("idle"), 2000);
    } catch (error) {
      logExportError("generarInformePDF", error);
      setEstado("idle");
    }
  }, [
    terreno,
    proyectoActual,
    zonas,
    plantas,
    catalogoCultivos,
    alertasHook.alertas,
    onExtraerMapa,
    climaDatos,
  ]);

  const handleCopiarIA = useCallback(async () => {
    if (!climaDatos) {
      logExportError(
        "copiarPaqueteIA",
        new Error("No hay datos climaticos en el proyecto"),
      );
      return;
    }
    try {
      const json = generarPaqueteIA({
        terreno,
        zonas,
        plantas,
        catalogoCultivos,
        alertas: alertasHook.alertas,
        clima: climaDatos,
        suelo: proyectoActual?.suelo,
      });
      await navigator.clipboard.writeText(json);
      setEstado("copied");
      setTimeout(() => setEstado("idle"), 2000);
    } catch (error) {
      logExportError("copiarPaqueteIA", error);
    }
  }, [
    terreno,
    proyectoActual,
    zonas,
    plantas,
    catalogoCultivos,
    alertasHook.alertas,
    climaDatos,
  ]);

  const handleExportarPlano = useCallback(async () => {
    try {
      const json = generarExportPlano(terreno, zonas);
      await navigator.clipboard.writeText(json);
      setEstado("plano_copied");
      setTimeout(() => setEstado("idle"), 2000);
    } catch (error) {
      logExportError("exportarPlano", error);
    }
  }, [terreno, zonas]);

  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-2">
      {estado === "done" && (
        <div className="bg-green-100 text-green-800 text-xs px-3 py-1.5 rounded-lg shadow text-center font-medium">
          PDF descargado
        </div>
      )}
      {estado === "copied" && (
        <div className="bg-blue-100 text-blue-800 text-xs px-3 py-1.5 rounded-lg shadow text-center font-medium">
          Datos copiados al portapapeles
        </div>
      )}
      {estado === "plano_copied" && (
        <div className="bg-green-100 text-green-800 text-xs px-3 py-1.5 rounded-lg shadow text-center font-medium">
          Plano copiado al portapapeles
        </div>
      )}

      <button
        onClick={handleExportarPDF}
        disabled={estado === "generating"}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
        title="Generar informe tecnico completo en PDF"
      >
        <span>{estado === "generating" ? "⏳" : "📋"}</span>
        <span>{estado === "generating" ? "Generando..." : "Informe PDF"}</span>
      </button>

      <button
        onClick={onExportarPNG}
        className="flex items-center gap-2 px-4 py-2 rounded-lg shadow-md text-sm font-medium text-blue-700 bg-white border border-blue-200 transition-all active:scale-95 hover:bg-blue-50"
        title="Descargar imagen PNG del mapa con medidas"
      >
        <span>📷</span>
        <span>Solo Imagen PNG</span>
      </button>

      <button
        onClick={handleCopiarIA}
        className="flex items-center gap-2 px-4 py-2 rounded-lg shadow-md text-sm font-medium text-purple-700 bg-white border border-purple-200 transition-all active:scale-95 hover:bg-purple-50"
        title="Copiar datos estructurados para analisis con IA"
      >
        <span>🤖</span>
        <span>Copiar para IA</span>
      </button>

      <button
        onClick={handleExportarPlano}
        className="flex items-center gap-2 px-4 py-2 rounded-lg shadow-md text-sm font-medium text-green-700 bg-white border border-green-200 transition-all active:scale-95 hover:bg-green-50"
        title="Copiar plano con coordenadas exactas para clonar o respaldar"
      >
        <span>📐</span>
        <span>Exportar Plano</span>
      </button>
    </div>
  );
}
