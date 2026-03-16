"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useProjectContext } from "@/contexts/project-context";
import { PageLayout } from "@/components/layout";
import {
  FormularioCalidadAgua,
  ProveedoresAgua,
  ContingenciasAguaPanel,
  TecnicasAhorro,
} from "@/components/agua";
import type {
  CalidadAguaTerreno,
  ProveedorAgua,
  ContingenciasAgua,
  AguaAvanzadaTerreno,
  FuenteAgua,
} from "@/types";
import { terrenosDAL, baseDataDAL } from "@/lib/dal";
import { ejecutarMutacion } from "@/lib/helpers/dal-mutation";
import { getCurrentTimestamp } from "@/lib/utils";

type TabId = "calidad" | "proveedores" | "contingencias" | "ahorro";

const TABS: { id: TabId; label: string }[] = [
  { id: "calidad", label: "Calidad del Agua" },
  { id: "proveedores", label: "Proveedores" },
  { id: "contingencias", label: "Contingencias" },
  { id: "ahorro", label: "Técnicas Ahorro" },
];

const DEFAULT_CONTINGENCIAS: ContingenciasAgua = {
  buffer_minimo_pct: 30,
  alerta_critica_pct: 20,
  plan_si_no_llega: [],
};

export default function AguaConfiguracionPage() {
  const {
    terrenoActual: terreno,
    datosBaseHook,
    proyectoActual,
  } = useProjectContext();
  const [activeTab, setActiveTab] = useState<TabId>("calidad");
  const loadedTerrenoId = useRef<string | null>(null);

  const [calidad, setCalidad] = useState<CalidadAguaTerreno>({});
  const [proveedores, setProveedores] = useState<ProveedorAgua[]>([]);
  const [contingencias, setContingencias] = useState<ContingenciasAgua>(
    DEFAULT_CONTINGENCIAS,
  );
  // Cargar agua_avanzada al montar o cambiar terreno (solo una vez por terreno)
  useEffect(() => {
    if (!terreno || loadedTerrenoId.current === terreno.id) return;
    loadedTerrenoId.current = terreno.id;
    const avanzada = terreno.agua_avanzada ?? {};
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial, ref guard evita cascada
    setCalidad(avanzada.calidad ?? {});

    setProveedores(avanzada.proveedores ?? []);

    setContingencias(avanzada.contingencias ?? DEFAULT_CONTINGENCIAS);
  }, [terreno]);

  const persistir = useCallback(
    async (patch: Partial<AguaAvanzadaTerreno>) => {
      if (!terreno) return;
      const prev = terreno.agua_avanzada ?? {};
      await ejecutarMutacion(
        () =>
          terrenosDAL.update(terreno.id, {
            agua_avanzada: { ...prev, ...patch },
            updated_at: getCurrentTimestamp(),
          }),
        "persistir agua avanzada",
      );
    },
    [terreno],
  );

  const aguaActualPct = useMemo(() => {
    if (!terreno) return 100;
    const actual = terreno.agua_actual_m3 ?? 0;
    const capacidad = terreno.agua_disponible_m3;
    if (!capacidad || capacidad <= 0) return 100;
    const pct = (actual / capacidad) * 100;
    return isFinite(pct) ? Math.round(pct) : 100;
  }, [terreno]);

  const handleCalidadChange = useCallback(
    (c: CalidadAguaTerreno) => {
      setCalidad(c);
      persistir({ calidad: c });
    },
    [persistir],
  );

  const handleProveedoresChange = useCallback(
    (p: ProveedorAgua[]) => {
      setProveedores(p);
      persistir({ proveedores: p });
    },
    [persistir],
  );

  const handleContingenciasChange = useCallback(
    (c: ContingenciasAgua) => {
      setContingencias(c);
      persistir({ contingencias: c });
    },
    [persistir],
  );

  const handleCrearFuente = useCallback(
    async (fuente: Omit<FuenteAgua, "id">) => {
      if (!proyectoActual?.id) return;
      await ejecutarMutacion(
        () => baseDataDAL.createFuenteAgua(proyectoActual.id, fuente),
        "crear fuente de agua",
        datosBaseHook.recargarDatosBase,
      );
    },
    [proyectoActual, datosBaseHook.recargarDatosBase],
  );

  const handleEliminarFuente = useCallback(
    async (fuenteId: string) => {
      if (!proyectoActual?.id) return;
      await ejecutarMutacion(
        () => baseDataDAL.deleteFuenteAgua(fuenteId, proyectoActual.id),
        "eliminar fuente de agua",
        datosBaseHook.recargarDatosBase,
      );
    },
    [proyectoActual, datosBaseHook.recargarDatosBase],
  );

  return (
    <PageLayout headerColor="cyan" title="Configuración de Agua">
      <main className="max-w-4xl mx-auto p-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h2 className="font-bold text-blue-800 mb-1">Importante</h2>
          <p className="text-sm text-blue-700">
            La calidad del agua limita qué cultivos puedes plantar. Agua del
            Lluta tiene {">"}11 ppm boro (tóxico para muchos cultivos).
            <br />
            <strong>INIA análisis:</strong> ~$75,000 CLP agua
          </p>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-cyan-600 text-white"
                  : "bg-white text-gray-700 border hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-lg border p-4">
          {activeTab === "calidad" && (
            <FormularioCalidadAgua
              calidad={calidad}
              onChange={handleCalidadChange}
              fuentesAgua={datosBaseHook.datosBase.fuentesAgua}
              onCrearFuente={handleCrearFuente}
              onEliminarFuente={handleEliminarFuente}
            />
          )}

          {activeTab === "proveedores" && (
            <ProveedoresAgua
              proveedores={proveedores}
              onChange={handleProveedoresChange}
            />
          )}

          {activeTab === "contingencias" && (
            <ContingenciasAguaPanel
              contingencias={contingencias}
              proveedores={proveedores}
              aguaActualPct={aguaActualPct}
              onChange={handleContingenciasChange}
            />
          )}

          {activeTab === "ahorro" && (
            <TecnicasAhorro
              tecnicasCatalogo={datosBaseHook.datosBase.tecnicas}
            />
          )}
        </div>
      </main>
    </PageLayout>
  );
}
