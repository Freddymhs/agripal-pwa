"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";
import { useProjectContext } from "./project-context";
import { calcularGridParams } from "@/lib/validations/planta";
import type { GridParams } from "@/lib/validations/planta";
import { advertenciaEliminarZona } from "@/lib/validations/zona";
import type { ZonaPreviewData } from "@/components/mapa/editor-zona";
import { CATALOGO_DEFAULT } from "@/lib/data/cultivos-arica";
import { TIPO_ZONA } from "@/lib/constants/entities";
import { useMapHandlers } from "@/hooks/use-map-handlers";
import type {
  Zona,
  Planta,
  TipoZona,
  CatalogoCultivo,
  EstadoPlanta,
  EtapaCrecimiento,
  EstanqueConfig,
} from "@/types";

export type Modo = "terreno" | "zonas" | "plantas" | "crear_zona" | "plantar";

interface MapContextType {
  modo: Modo;
  setModo: (m: Modo) => void;
  zonaSeleccionada: Zona | null;
  setZonaSeleccionada: (z: Zona | null) => void;
  plantaSeleccionada: Planta | null;
  setPlantaSeleccionada: (p: Planta | null) => void;
  plantasSeleccionadas: string[];
  setPlantasSeleccionadas: (ids: string[]) => void;
  rectNuevaZona: { x: number; y: number; ancho: number; alto: number } | null;
  setRectNuevaZona: (
    r: { x: number; y: number; ancho: number; alto: number } | null,
  ) => void;
  showGridModal: boolean;
  setShowGridModal: (v: boolean) => void;
  zonaPreview: ZonaPreviewData | null;
  setZonaPreview: (v: ZonaPreviewData | null) => void;
  cultivoSeleccionado: CatalogoCultivo;
  setCultivoSeleccionado: (c: CatalogoCultivo) => void;
  panelTab: "terreno" | "recomendacion";
  setPanelTab: (t: "terreno" | "recomendacion") => void;

  gridParams: GridParams | null;
  posicionesOcupadas: Set<string>;
  plantasZonaSeleccionada: Planta[];

  handleMapClick: (x: number, y: number) => Promise<void>;
  handlePlantaClick: (planta: Planta) => void;
  handleCambiarEstadoPlanta: (estado: EstadoPlanta) => Promise<void>;
  handleCambiarEtapaPlanta: (etapa: EtapaCrecimiento) => Promise<void>;
  handleEliminarPlanta: () => Promise<void>;
  handlePlantarGrid: (espaciado: number) => Promise<void>;
  handleCrearZona: (data: {
    nombre: string;
    tipo: TipoZona;
    estanque_config?: EstanqueConfig;
  }) => Promise<void>;
  handleEliminarZona: () => Promise<void>;
  handleGuardarZona: (cambios: Partial<Zona>) => Promise<void>;
  validarCambiosZona: (
    nuevaPos: { x: number; y: number },
    nuevoTam: { ancho: number; alto: number },
  ) => { valida: boolean; error?: string };
  handleMoverPlantasSeleccionadas: (
    plantaId: string,
    deltaX: number,
    deltaY: number,
  ) => Promise<void>;
  advertenciaEliminacionZona: string | null;
}

const MapContext = createContext<MapContextType | null>(null);

export function useMapContext() {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error("useMapContext must be used within MapProvider");
  return ctx;
}

export function MapProvider({ children }: { children: ReactNode }) {
  const {
    terrenoActual,
    zonas,
    plantas,
    catalogoCultivos,
    zonasHook,
    plantasHook,
    plantasLoteHook,
  } = useProjectContext();

  const [modo, setModo] = useState<Modo>("terreno");
  const [zonaSeleccionada, setZonaSeleccionada] = useState<Zona | null>(null);
  const [plantaSeleccionada, setPlantaSeleccionada] = useState<Planta | null>(
    null,
  );
  const [plantasSeleccionadas, setPlantasSeleccionadas] = useState<string[]>(
    [],
  );
  const [rectNuevaZona, setRectNuevaZona] = useState<{
    x: number;
    y: number;
    ancho: number;
    alto: number;
  } | null>(null);
  const [showGridModal, setShowGridModal] = useState(false);
  const [zonaPreview, setZonaPreview] = useState<ZonaPreviewData | null>(null);
  const [cultivoSeleccionado, setCultivoSeleccionado] =
    useState<CatalogoCultivo>(CATALOGO_DEFAULT[0]);
  const [panelTab, setPanelTab] = useState<"terreno" | "recomendacion">(
    "terreno",
  );

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && plantasSeleccionadas.length > 0)
        setPlantasSeleccionadas([]);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [plantasSeleccionadas.length]);

  // Sincronización estado seleccionado con datos externos (IndexedDB → React).
  // El setState dentro de effects es intencional: sincroniza estado derivado
  // cuando la fuente de datos cambia (zona eliminada, planta actualizada, etc.)
  useEffect(() => {
    if (catalogoCultivos.length > 0) {
      const match = catalogoCultivos.find(
        (c) => c.id === cultivoSeleccionado.id,
      );
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincronización: si el cultivo seleccionado ya no existe en el catálogo, resetear al primero
      if (!match) setCultivoSeleccionado(catalogoCultivos[0]);
    }
  }, [catalogoCultivos, cultivoSeleccionado.id]);

  useEffect(() => {
    if (zonaSeleccionada) {
      const zonaActualizada = zonas.find((z) => z.id === zonaSeleccionada.id);
      if (!zonaActualizada) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- sincronización: zona eliminada externamente → limpiar selección
        setZonaSeleccionada(null);
      } else if (
        JSON.stringify(zonaActualizada) !== JSON.stringify(zonaSeleccionada)
      ) {
        setZonaSeleccionada(zonaActualizada);
      }
    }
  }, [zonas, zonaSeleccionada]);

  useEffect(() => {
    if (plantaSeleccionada) {
      const plantaActualizada = plantas.find(
        (p) => p.id === plantaSeleccionada.id,
      );
      if (!plantaActualizada) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- sincronización: planta eliminada externamente → limpiar selección
        setPlantaSeleccionada(null);
      } else if (
        JSON.stringify(plantaActualizada) !== JSON.stringify(plantaSeleccionada)
      ) {
        setPlantaSeleccionada(plantaActualizada);
      }
    }
  }, [plantas, plantaSeleccionada]);

  const plantasZonaSeleccionada = useMemo(
    () =>
      zonaSeleccionada
        ? plantas.filter((p) => p.zona_id === zonaSeleccionada.id)
        : [],
    [plantas, zonaSeleccionada],
  );

  const gridParams: GridParams | null = useMemo(() => {
    if (
      modo !== "plantar" ||
      !zonaSeleccionada ||
      zonaSeleccionada.tipo !== TIPO_ZONA.CULTIVO
    )
      return null;
    if (!cultivoSeleccionado.espaciado_recomendado_m) return null;
    return calcularGridParams(
      zonaSeleccionada,
      cultivoSeleccionado.espaciado_recomendado_m,
    );
  }, [modo, zonaSeleccionada, cultivoSeleccionado]);

  const posicionesOcupadas: Set<string> = useMemo(() => {
    const set = new Set<string>();
    if (!gridParams || !zonaSeleccionada) return set;
    const { margenX, margenY, espaciado } = gridParams;
    for (const planta of plantasZonaSeleccionada) {
      set.add(
        `${Math.round((planta.x - margenX) / espaciado)},${Math.round((planta.y - margenY) / espaciado)}`,
      );
    }
    return set;
  }, [gridParams, zonaSeleccionada, plantasZonaSeleccionada]);

  const getCultivoSeleccionado = useCallback(
    () => cultivoSeleccionado,
    [cultivoSeleccionado],
  );

  const handlers = useMapHandlers({
    modo,
    zonaSeleccionada,
    plantaSeleccionada,
    plantas,
    zonas,
    catalogoCultivos,
    terrenoActual,
    cultivoSeleccionadoId: cultivoSeleccionado.id,
    cultivoSeleccionadoNombre: cultivoSeleccionado.nombre,
    gridParams,
    posicionesOcupadas,
    rectNuevaZona,
    plantasHook,
    zonasHook,
    setPlantaSeleccionada,
    setZonaSeleccionada,
    setRectNuevaZona,
    setModo: setModo as (m: string) => void,
    setShowGridModal,
    getCultivoSeleccionado,
  });

  const advertenciaEliminacionZona = useMemo(
    () =>
      zonaSeleccionada
        ? advertenciaEliminarZona(zonaSeleccionada, plantas)
        : null,
    [zonaSeleccionada, plantas],
  );

  const value: MapContextType = useMemo(
    () => ({
      modo,
      setModo,
      zonaSeleccionada,
      setZonaSeleccionada,
      plantaSeleccionada,
      setPlantaSeleccionada,
      plantasSeleccionadas,
      setPlantasSeleccionadas,
      rectNuevaZona,
      setRectNuevaZona,
      showGridModal,
      setShowGridModal,
      zonaPreview,
      setZonaPreview,
      cultivoSeleccionado,
      setCultivoSeleccionado,
      panelTab,
      setPanelTab,
      gridParams,
      posicionesOcupadas,
      plantasZonaSeleccionada,
      ...handlers,
      advertenciaEliminacionZona,
    }),
    [
      modo,
      zonaSeleccionada,
      plantaSeleccionada,
      plantasSeleccionadas,
      rectNuevaZona,
      showGridModal,
      zonaPreview,
      cultivoSeleccionado,
      panelTab,
      gridParams,
      posicionesOcupadas,
      plantasZonaSeleccionada,
      handlers,
      advertenciaEliminacionZona,
    ],
  );

  // Suppress unused var warning for plantasLoteHook (kept in context for potential consumers)
  void plantasLoteHook;

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
}
