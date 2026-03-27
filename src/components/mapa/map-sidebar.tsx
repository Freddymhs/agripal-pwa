"use client";

import { useState, useCallback, useMemo } from "react";
import { logger } from "@/lib/logger";
import { useProjectContext } from "@/contexts/project-context";
import { useMapContext } from "@/contexts/map-context";
import { EditorZona } from "@/components/mapa/editor-zona";
import { EstanquePanel } from "@/components/mapa/estanque-panel";
import { ZonaCultivoPanel } from "@/components/mapa/zona-cultivo-panel";
import { MapSidebarEmpty } from "@/components/mapa/map-sidebar-empty";
import { AguaPanelTerreno } from "@/components/mapa/agua-panel-terreno";
import { PlantaInfo } from "@/components/plantas/planta-info";
import { AccionesLote } from "@/components/plantas/acciones-lote";
import { EntradaAguaForm, ConfigurarAguaModal } from "@/components/agua";
import { useAgua } from "@/hooks/use-agua";
import { getTemporadaActual } from "@/lib/data/calculos-clima";
import {
  calcularDiasRestantesCritico,
  calcularConsumoEstanque,
} from "@/lib/utils/agua";
import { MS_POR_DIA } from "@/lib/constants/conversiones";
import type { UUID } from "@/types";
import { TIPO_ZONA } from "@/lib/constants/entities";

export function MapSidebar() {
  const {
    terrenoActual,
    zonas,
    plantas,
    catalogoCultivos,
    estanquesHook,
    zonasHook,
    plantasLoteHook,
    handleCambiarFuente,
    setShowConfigAvanzada,
    cargarDatosTerreno,
    opcionesConsumoAgua,
  } = useProjectContext();

  const {
    zonaSeleccionada,
    plantaSeleccionada,
    setPlantaSeleccionada,
    plantasSeleccionadas,
    setPlantasSeleccionadas,
    setZonaSeleccionada,
    plantasZonaSeleccionada,
    handleCambiarEstadoPlanta,
    handleCambiarEtapaPlanta,
    handleEliminarPlanta,
    handleGuardarZona,
    handleEliminarZona,
    validarCambiosZona,
    advertenciaEliminacionZona,
    setZonaPreview,
  } = useMapContext();

  const [showEntradaAguaForm, setShowEntradaAguaForm] = useState(false);
  const [estanqueIdParaAgua, setEstanqueIdParaAgua] = useState<UUID | null>(
    null,
  );
  const [showConfigRecarga, setShowConfigRecarga] = useState(false);
  const [estanqueIdForRecarga, setEstanqueIdForRecarga] = useState<UUID | null>(
    null,
  );

  const {
    entradas,
    consumoSemanal,
    registrarEntrada,
    configurarRecarga,
    quitarRecarga,
  } = useAgua(
    terrenoActual,
    zonas,
    plantas,
    catalogoCultivos,
    cargarDatosTerreno,
    opcionesConsumoAgua,
  );

  const handleAbrirFormularioAguaGeneral = useCallback(() => {
    setEstanqueIdParaAgua(null);
    setShowEntradaAguaForm(true);
  }, []);

  const handleAbrirConfigRecarga = useCallback((estanqueId: string) => {
    setEstanqueIdForRecarga(estanqueId as UUID);
    setShowConfigRecarga(true);
  }, []);

  // --- Agua: cálculos para el panel de terreno ---
  const temporada = useMemo(() => getTemporadaActual(), []);

  const { diasCritico, porEstanque: diasPorEstanque } = useMemo(
    () =>
      calcularDiasRestantesCritico(
        estanquesHook.estanques,
        zonas,
        plantas,
        catalogoCultivos,
        temporada,
        opcionesConsumoAgua,
      ),
    [
      estanquesHook.estanques,
      zonas,
      plantas,
      catalogoCultivos,
      temporada,
      opcionesConsumoAgua,
    ],
  );

  // Próxima recarga más cercana entre todos los estanques (para indicador "alcanza hasta el camión")
  // useState initializer se ejecuta una vez en mount — aceptado como impuro por React
  const [mountMs] = useState(() => Date.now());
  const diasHastaRecarga = useMemo(
    () =>
      estanquesHook.estanques.reduce<number | null>((min, est) => {
        const proxima = est.estanque_config?.recarga?.proxima_recarga;
        if (!proxima) return min;
        const dias = Math.round(
          (new Date(proxima).getTime() - mountMs) / MS_POR_DIA,
        );
        return min === null || dias < min ? dias : min;
      }, null),
    [estanquesHook.estanques, mountMs],
  );

  const estanqueParaRecarga =
    estanquesHook.estanques.find((e) => e.id === estanqueIdForRecarga) ?? null;

  const consumoEstanqueRecarga = useMemo(
    () =>
      estanqueIdForRecarga
        ? calcularConsumoEstanque(
            estanqueIdForRecarga,
            zonas,
            plantas,
            catalogoCultivos,
            temporada,
            opcionesConsumoAgua,
          )
        : 0,
    [
      estanqueIdForRecarga,
      zonas,
      plantas,
      catalogoCultivos,
      temporada,
      opcionesConsumoAgua,
    ],
  );

  const handleGuardarRecarga = useCallback(
    async (config: {
      frecuencia_dias: number;
      cantidad_litros: number;
      costo_transporte_clp?: number;
      proveedor_id?: string;
    }) => {
      if (!estanqueIdForRecarga) return;
      await configurarRecarga(estanqueIdForRecarga, config);
      setShowConfigRecarga(false);
    },
    [estanqueIdForRecarga, configurarRecarga],
  );

  const handleQuitarRecarga = useCallback(async () => {
    if (!estanqueIdForRecarga) return;
    await quitarRecarga(estanqueIdForRecarga);
    setShowConfigRecarga(false);
  }, [estanqueIdForRecarga, quitarRecarga]);

  if (!terrenoActual) return null;

  return (
    <aside
      className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-hidden"
      style={{ maxHeight: "calc(100dvh - 130px)" }}
    >
      {(zonaSeleccionada ||
        plantaSeleccionada ||
        plantasSeleccionadas.length > 0) && (
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            {plantasSeleccionadas.length > 0
              ? "Selección Múltiple"
              : plantaSeleccionada
                ? "Planta"
                : "Editar Zona"}
          </h2>
        </div>
      )}

      <div className="flex-1 overflow-y-auto min-h-0">
        {plantasSeleccionadas.length > 0 ? (
          <div className="p-4">
            <AccionesLote
              cantidad={plantasSeleccionadas.length}
              onCambiarEstado={async (estado) => {
                await plantasLoteHook.cambiarEstadoMultiple(
                  plantasSeleccionadas,
                  estado,
                );
                setPlantasSeleccionadas([]);
              }}
              onEliminar={async () => {
                await plantasLoteHook.eliminarMultiple(plantasSeleccionadas);
                setPlantasSeleccionadas([]);
              }}
              onCancelar={() => setPlantasSeleccionadas([])}
            />
          </div>
        ) : plantaSeleccionada ? (
          <PlantaInfo
            planta={plantaSeleccionada}
            cultivo={catalogoCultivos.find(
              (c) => c.id === plantaSeleccionada.tipo_cultivo_id,
            )}
            onCambiarEstado={handleCambiarEstadoPlanta}
            onCambiarEtapa={handleCambiarEtapaPlanta}
            onEliminar={handleEliminarPlanta}
            onClose={() => setPlantaSeleccionada(null)}
          />
        ) : zonaSeleccionada ? (
          <div>
            <EditorZona
              zona={zonaSeleccionada}
              cantidadPlantas={plantasZonaSeleccionada.length}
              onSave={handleGuardarZona}
              onRedimensionar={(size) =>
                zonasHook.redimensionarZona(zonaSeleccionada.id, size)
              }
              onMover={(pos) => zonasHook.moverZona(zonaSeleccionada.id, pos)}
              onDelete={handleEliminarZona}
              onClose={() => setZonaSeleccionada(null)}
              onPreviewChange={setZonaPreview}
              validarCambios={validarCambiosZona}
              advertenciaEliminacion={advertenciaEliminacionZona}
            />

            {zonaSeleccionada.tipo === TIPO_ZONA.CULTIVO && (
              <ZonaCultivoPanel />
            )}

            {zonaSeleccionada.tipo === TIPO_ZONA.ESTANQUE &&
              zonaSeleccionada.estanque_config && (
                <div className="border-t">
                  <EstanquePanel
                    estanque={zonaSeleccionada}
                    zonas={zonas}
                    plantas={plantas}
                    catalogoCultivos={catalogoCultivos}
                    onCambiarFuente={handleCambiarFuente}
                  />
                </div>
              )}
          </div>
        ) : (
          <MapSidebarEmpty
            terrenoActual={terrenoActual}
            zonas={zonas}
            onConfigAvanzada={() => setShowConfigAvanzada(true)}
          >
            <AguaPanelTerreno
              estanques={estanquesHook.estanques}
              aguaTotalActual={estanquesHook.aguaTotalActual}
              aguaTotalDisponible={estanquesHook.aguaTotalDisponible}
              consumoSemanal={consumoSemanal}
              diasCritico={diasCritico}
              diasPorEstanque={diasPorEstanque}
              diasHastaRecarga={diasHastaRecarga}
              entradas={entradas}
              onRegistrarAgua={handleAbrirFormularioAguaGeneral}
              onConfigurarRecarga={handleAbrirConfigRecarga}
            />
          </MapSidebarEmpty>
        )}
      </div>

      {showEntradaAguaForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <EntradaAguaForm
              estanques={estanquesHook.estanques}
              estanqueIdPrecargado={estanqueIdParaAgua || undefined}
              onRegistrar={async (data) => {
                try {
                  await registrarEntrada(data);
                  setShowEntradaAguaForm(false);
                  setEstanqueIdParaAgua(null);
                } catch (error) {
                  logger.error("Error al registrar entrada de agua", {
                    error:
                      error instanceof Error
                        ? { message: error.message }
                        : { error },
                  });
                }
              }}
              onCancelar={() => {
                setShowEntradaAguaForm(false);
                setEstanqueIdParaAgua(null);
              }}
            />
          </div>
        </div>
      )}

      {showConfigRecarga && estanqueParaRecarga && (
        <ConfigurarAguaModal
          estanque={estanqueParaRecarga}
          consumoSemanal={consumoEstanqueRecarga}
          proveedores={terrenoActual?.agua_avanzada?.proveedores ?? []}
          onGuardar={handleGuardarRecarga}
          onQuitar={handleQuitarRecarga}
          onCerrar={() => {
            setShowConfigRecarga(false);
            setEstanqueIdForRecarga(null);
          }}
        />
      )}
    </aside>
  );
}
