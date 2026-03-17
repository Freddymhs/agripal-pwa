"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useAuthContext } from "@/components/providers/auth-provider";
import { useProyectos } from "@/hooks/use-proyectos";
import { useTerrenos } from "@/hooks/use-terrenos";
import { useCatalogo } from "@/hooks/use-catalogo";
import { useAlertas } from "@/hooks/use-alertas";
import { useEstanques } from "@/hooks/use-estanques";
import { useZonas } from "@/hooks/use-zonas";
import { usePlantas } from "@/hooks/use-plantas";
import { usePlantasLote } from "@/hooks/use-plantas-lote";
import { useActualizarEtapas } from "@/hooks/use-actualizar-etapas";
import { useDatosBase } from "@/hooks/use-datos-base";
import { useProjectDashboard } from "@/hooks/use-project-dashboard";
import { useProjectHandlers } from "@/hooks/use-project-handlers";
import { zonasDAL, plantasDAL, proyectosDAL } from "@/lib/dal";
import { asignarColorCultivo } from "@/components/mapa/pixi/pixi-constants";
import { onZonaUpdated } from "@/lib/events/zona-events";
import { aplicarDescuentoAutomaticoAgua } from "@/lib/utils/agua-descuento";
import { filtrarEstanques } from "@/lib/utils/helpers-cultivo";
import { STORAGE_KEYS } from "@/lib/constants/storage";
import { getCurrentTimestamp } from "@/lib/utils";
import { ejecutarMutacion } from "@/lib/helpers/dal-mutation";
import { logger } from "@/lib/logger";
import type {
  Terreno,
  Zona,
  Planta,
  Proyecto,
  ProveedorAgua,
  SueloTerreno,
} from "@/types";
import type { ProjectContextType } from "./project-context-types";

const ProjectContext = createContext<ProjectContextType | null>(null);

export function useProjectContext() {
  const ctx = useContext(ProjectContext);
  if (!ctx)
    throw new Error("useProjectContext must be used within ProjectProvider");
  return ctx;
}

export function useOptionalProjectContext() {
  return useContext(ProjectContext);
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const {
    usuario,
    loading: authLoading,
    isAuthenticated,
    signOut: logout,
  } = useAuthContext();
  const [proyectoActual, setProyectoActual] = useState<Proyecto | null>(null);
  const [terrenoActual, setTerrenoActual] = useState<Terreno | null>(null);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [plantas, setPlantas] = useState<Planta[]>([]);
  const [loading, setLoading] = useState(true);
  const [terrenoIdCargado, setTerrenoIdCargado] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [showCrearProyecto, setShowCrearProyecto] = useState(false);
  const [showCrearTerreno, setShowCrearTerreno] = useState(false);
  const [showConfigAvanzada, setShowConfigAvanzada] = useState(false);

  const proyectosHook = useProyectos();
  const terrenosHook = useTerrenos(proyectoActual?.id || null);
  const catalogoHook = useCatalogo(proyectoActual?.id || null);
  const catalogoCultivos = catalogoHook.cultivos;
  const proveedoresAgua = useMemo(
    () => proyectoActual?.proveedores_agua ?? [],
    [proyectoActual?.proveedores_agua],
  );
  const datosListos = terrenoIdCargado === terrenoActual?.id;
  const alertasHook = useAlertas(
    terrenoActual,
    zonas,
    plantas,
    catalogoCultivos,
    proyectoActual?.suelo,
    datosListos,
    proyectoActual?.clima_base_id ?? null,
    proveedoresAgua,
    proyectoActual?.id,
  );
  const datosBaseHook = useDatosBase(proyectoActual?.id || null);
  const CULTIVOS_ESPACIADO = useMemo(
    () =>
      catalogoCultivos.reduce<Record<string, number>>(
        (acc, c) => ({ ...acc, [c.id]: c.espaciado_recomendado_m }),
        {},
      ),
    [catalogoCultivos],
  );
  const CULTIVOS_COLORES = useMemo(
    () =>
      catalogoCultivos.reduce<Record<string, number>>(
        (acc, c, i) => ({ ...acc, [c.id]: asignarColorCultivo(i) }),
        {},
      ),
    [catalogoCultivos],
  );

  useEffect(() => {
    if (!initialLoad || authLoading) return;

    // Si no está autenticado, no hay proyectos que cargar — salir del estado de carga.
    if (!isAuthenticated) {
      setInitialLoad(false);
      return;
    }

    // Esperar a que los proyectos del usuario real estén disponibles.
    if (!proyectosHook.loading) {
      const savedId = localStorage.getItem(STORAGE_KEYS.PROYECTO);
      if (savedId) {
        const p = proyectosHook.proyectos.find((p) => p.id === savedId);
        if (p) setProyectoActual(p);
      }
      if (!savedId && proyectosHook.proyectos.length > 0)
        setProyectoActual(proyectosHook.proyectos[0]);
      setInitialLoad(false);
    }
  }, [
    authLoading,
    isAuthenticated,
    proyectosHook.loading,
    proyectosHook.proyectos,
    initialLoad,
  ]);

  useEffect(() => {
    if (proyectoActual && !terrenosHook.loading) {
      const savedId = localStorage.getItem(STORAGE_KEYS.TERRENO);
      if (savedId) {
        const t = terrenosHook.terrenos.find((t) => t.id === savedId);
        if (t) {
          setTerrenoActual(t);
          return;
        }
      }
      setTerrenoActual(
        terrenosHook.terrenos.length > 0 ? terrenosHook.terrenos[0] : null,
      );
    }
  }, [proyectoActual, terrenosHook.loading, terrenosHook.terrenos]);

  useEffect(() => {
    if (proyectoActual)
      localStorage.setItem(STORAGE_KEYS.PROYECTO, proyectoActual.id);
  }, [proyectoActual]);
  useEffect(() => {
    if (terrenoActual)
      localStorage.setItem(STORAGE_KEYS.TERRENO, terrenoActual.id);
  }, [terrenoActual]);

  const initialLoadDone = useRef(false);
  const cargarDatosTerreno = useCallback(async () => {
    if (!terrenoActual) {
      setZonas([]);
      setPlantas([]);
      setLoading(false);
      setTerrenoIdCargado(null);
      return;
    }
    try {
      if (!initialLoadDone.current) setLoading(true);
      const zonasData = await zonasDAL.getByTerrenoId(terrenoActual.id);
      setZonas(zonasData);
      const zonaIds = zonasData.map((z) => z.id);
      setPlantas(
        zonaIds.length > 0 ? await plantasDAL.getByZonaIds(zonaIds) : [],
      );
      setTerrenoIdCargado(terrenoActual.id);
    } catch (error) {
      logger.error("Error cargando datos", {
        error: error instanceof Error ? { message: error.message } : { error },
      });
    } finally {
      setLoading(false);
      initialLoadDone.current = true;
    }
  }, [terrenoActual]);

  useEffect(() => {
    initialLoadDone.current = false;
    cargarDatosTerreno();
  }, [cargarDatosTerreno]);
  useEffect(() => {
    return onZonaUpdated(() => cargarDatosTerreno());
  }, [cargarDatosTerreno]);

  // Descuento automático de agua — corre al cargar el proyecto, sin importar qué página se abra
  const descuentoAguaAplicado = useRef(false);
  useEffect(() => {
    descuentoAguaAplicado.current = false;
  }, [terrenoActual?.id]);
  useEffect(() => {
    if (!datosListos || !terrenoActual || descuentoAguaAplicado.current) return;

    const estanques = filtrarEstanques(zonas);
    if (estanques.length === 0) return;

    const cancelledRef = { current: false };
    descuentoAguaAplicado.current = true;

    aplicarDescuentoAutomaticoAgua(
      terrenoActual,
      estanques,
      zonas,
      plantas,
      catalogoCultivos,
      cancelledRef,
    )
      .then((resultado) => {
        if (resultado.aplicado && !cancelledRef.current) {
          cargarDatosTerreno();
        }
      })
      .catch((err) => {
        logger.error("Error aplicando descuento automático de agua", {
          error: err instanceof Error ? { message: err.message } : undefined,
        });
        descuentoAguaAplicado.current = false;
      });

    return () => {
      cancelledRef.current = true;
    };
  }, [
    datosListos,
    terrenoActual,
    zonas,
    plantas,
    catalogoCultivos,
    cargarDatosTerreno,
  ]);
  const estanquesHook = useEstanques(zonas, cargarDatosTerreno);
  const zonasHook = useZonas(
    terrenoActual?.id || "",
    terrenoActual ?? ({} as Terreno),
    zonas,
    plantas,
    cargarDatosTerreno,
  );
  const plantasHook = usePlantas(cargarDatosTerreno);
  const plantasLoteHook = usePlantasLote(cargarDatosTerreno);
  useActualizarEtapas(plantas, catalogoCultivos, cargarDatosTerreno);

  const dashboard = useProjectDashboard(
    terrenoActual,
    zonas,
    plantas,
    catalogoCultivos,
    alertasHook,
  );
  const {
    handleSelectProyecto,
    handleSelectTerreno,
    handleCrearProyecto,
    handleCrearTerreno: handleCrearTerrenoRaw,
    handleGuardarConfigAvanzada,
    handleCambiarFuente,
  } = useProjectHandlers({
    proyectosHook,
    terrenosHook,
    zonas,
    terrenoActual,
    setProyectoActual,
    setTerrenoActual,
    setShowCrearProyecto,
    setShowCrearTerreno,
    cargarDatosTerreno,
  });

  const handleCrearTerreno = useCallback(
    async (data: { nombre: string; ancho_m: number; alto_m: number }) => {
      if (!proyectoActual) return;
      await handleCrearTerrenoRaw(data, proyectoActual.id);
    },
    [proyectoActual, handleCrearTerrenoRaw],
  );

  const actualizarSueloProyecto = useCallback(
    async (suelo: SueloTerreno) => {
      if (!proyectoActual) return;
      await ejecutarMutacion(
        () =>
          proyectosDAL.update(proyectoActual.id, {
            suelo,
            updated_at: getCurrentTimestamp(),
          }),
        "actualizar suelo proyecto",
      );
      setProyectoActual((prev) => (prev ? { ...prev, suelo } : prev));
    },
    [proyectoActual],
  );

  const actualizarProveedoresProyecto = useCallback(
    async (proveedores: ProveedorAgua[]) => {
      if (!proyectoActual) return;
      await ejecutarMutacion(
        () =>
          proyectosDAL.update(proyectoActual.id, {
            proveedores_agua: proveedores,
            updated_at: getCurrentTimestamp(),
          }),
        "actualizar proveedores proyecto",
      );
      setProyectoActual((prev) =>
        prev ? { ...prev, proveedores_agua: proveedores } : prev,
      );
    },
    [proyectoActual],
  );

  const value: ProjectContextType = useMemo(
    () => ({
      usuario,
      authLoading,
      isAuthenticated,
      logout,
      proyectoActual,
      terrenoActual,
      setTerrenoActual,
      proyectos: proyectosHook.proyectos,
      terrenos: terrenosHook.terrenos,
      zonas,
      plantas,
      catalogoCultivos,
      loading,
      initialLoad: initialLoad || proyectosHook.loading,
      alertasHook,
      estanquesHook,
      zonasHook,
      plantasHook,
      plantasLoteHook,
      datosBaseHook,
      dashboard,
      CULTIVOS_ESPACIADO,
      CULTIVOS_COLORES,
      cargarDatosTerreno,
      handleSelectProyecto,
      handleSelectTerreno,
      handleCrearProyecto,
      handleCrearTerreno,
      handleGuardarConfigAvanzada,
      handleCambiarFuente,
      actualizarProveedoresProyecto,
      actualizarSueloProyecto,
      showCrearProyecto,
      setShowCrearProyecto,
      showCrearTerreno,
      setShowCrearTerreno,
      showConfigAvanzada,
      setShowConfigAvanzada,
    }),
    [
      usuario,
      authLoading,
      isAuthenticated,
      logout,
      proyectoActual,
      terrenoActual,
      proyectosHook.proyectos,
      terrenosHook.terrenos,
      zonas,
      plantas,
      catalogoCultivos,
      loading,
      initialLoad,
      proyectosHook.loading,
      alertasHook,
      estanquesHook,
      zonasHook,
      plantasHook,
      plantasLoteHook,
      datosBaseHook,
      dashboard,
      CULTIVOS_ESPACIADO,
      CULTIVOS_COLORES,
      cargarDatosTerreno,
      handleSelectProyecto,
      handleSelectTerreno,
      handleCrearProyecto,
      handleCrearTerreno,
      handleGuardarConfigAvanzada,
      handleCambiarFuente,
      actualizarProveedoresProyecto,
      actualizarSueloProyecto,
      showCrearProyecto,
      showCrearTerreno,
      showConfigAvanzada,
    ],
  );

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}
