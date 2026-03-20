"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { zonasDAL } from "@/lib/dal";
import { ejecutarMutacion } from "@/lib/helpers/dal-mutation";
import { useProjectContext } from "@/contexts/project-context";
import { useAgua } from "@/hooks/use-agua";
import { logger } from "@/lib/logger";
import { PageLayout } from "@/components/layout";
import {
  EntradaAguaForm,
  ResumenAgua,
  HistorialAgua,
  CollapsibleSection,
  EstanqueCardAgua,
} from "@/components/agua";
import { ConfigurarAguaModal } from "@/components/agua/configurar-agua-modal";
import { addDays } from "date-fns";
import { getCurrentTimestamp } from "@/lib/utils";
import { emitZonaUpdated } from "@/lib/events/zona-events";
import { TIPO_ZONA } from "@/lib/constants/entities";
import {
  calcularConsumoZona,
  calcularDiasRestantesCritico,
  calcularConsumoEstanque,
} from "@/lib/utils/agua";
import { getTemporadaActual } from "@/lib/utils";
import { MS_POR_DIA } from "@/lib/constants/conversiones";
import { ROUTES } from "@/lib/constants/routes";

export default function AguaPage() {
  const {
    proyectoActual,
    terrenoActual: terreno,
    zonas,
    plantas,
    catalogoCultivos,
    loading,
    cargarDatosTerreno: refetch,
    estanquesHook: { estanques, aguaTotalDisponible, aguaTotalActual },
    opcionesConsumoAgua,
  } = useProjectContext();
  const [showEntradaForm, setShowEntradaForm] = useState(false);
  const [showConfigRecarga, setShowConfigRecarga] = useState(false);
  const [estanqueSeleccionadoId, setEstanqueSeleccionadoId] = useState<
    string | null
  >(null);

  const { entradas, consumoSemanal, registrarEntrada } = useAgua(
    terreno,
    zonas,
    plantas,
    catalogoCultivos,
    refetch,
    opcionesConsumoAgua,
  );

  useEffect(() => {
    if (estanques.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincronización: limpia selección si no hay estanques
      setEstanqueSeleccionadoId(null);
      return;
    }

    setEstanqueSeleccionadoId((prev) => {
      const sigueExistiendo = prev && estanques.some((e) => e.id === prev);
      return sigueExistiendo ? prev : estanques[0].id;
    });
  }, [estanques]);

  const estanqueActual =
    estanques.find((e) => e.id === estanqueSeleccionadoId) ||
    estanques[0] ||
    null;

  const temporada = useMemo(() => getTemporadaActual(), []);

  const zonasConsumo = useMemo(() => {
    return zonas
      .filter((z) => z.tipo === TIPO_ZONA.CULTIVO)
      .map((zona) => {
        const plantasZona = plantas.filter((p) => p.zona_id === zona.id);
        const consumo = calcularConsumoZona(
          zona,
          plantasZona,
          catalogoCultivos,
          temporada,
          opcionesConsumoAgua,
        );
        return {
          zona,
          consumo,
          porcentaje: consumoSemanal > 0 ? (consumo / consumoSemanal) * 100 : 0,
        };
      })
      .filter((z) => z.consumo > 0)
      .sort((a, b) => b.consumo - a.consumo);
  }, [
    zonas,
    plantas,
    catalogoCultivos,
    consumoSemanal,
    temporada,
    opcionesConsumoAgua,
  ]);

  const configRecarga = estanqueActual?.estanque_config?.recarga;

  // Días restantes por estanque (cuello de botella real para multi-estanque)
  const { diasCritico, porEstanque: diasPorEstanque } = useMemo(
    () =>
      calcularDiasRestantesCritico(
        estanques,
        zonas,
        plantas,
        catalogoCultivos,
        temporada,
        opcionesConsumoAgua,
      ),
    [
      estanques,
      zonas,
      plantas,
      catalogoCultivos,
      temporada,
      opcionesConsumoAgua,
    ],
  );

  // Math.round evita el off-by-one que generaba Math.ceil (ej: 153.00001 → 154)
  const diasHastaRecarga = useMemo(() => {
    if (!configRecarga?.proxima_recarga) return null;
    return Math.round(
      (new Date(configRecarga.proxima_recarga).getTime() -
        new Date().getTime()) /
        MS_POR_DIA,
    );
  }, [configRecarga]);

  // Consumo y nivel del estanque seleccionado (para proyección de recarga)
  const consumoEstanqueActual = useMemo(
    () =>
      estanqueActual
        ? calcularConsumoEstanque(
            estanqueActual.id,
            zonas,
            plantas,
            catalogoCultivos,
            temporada,
            opcionesConsumoAgua,
          )
        : 0,
    [
      estanqueActual,
      zonas,
      plantas,
      catalogoCultivos,
      temporada,
      opcionesConsumoAgua,
    ],
  );

  if (loading) {
    return (
      <PageLayout headerColor="cyan">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Cargando...</div>
        </div>
      </PageLayout>
    );
  }

  if (!terreno) {
    return (
      <PageLayout headerColor="cyan">
        <main className="p-4">
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
            <p className="text-yellow-800">
              No hay terrenos creados. Crea uno primero desde la página
              principal.
            </p>
          </div>
        </main>
      </PageLayout>
    );
  }

  return (
    <PageLayout headerColor="cyan">
      <main className="p-4 space-y-4 max-w-4xl mx-auto">
        {/* Header informativo */}
        <div className="bg-cyan-50 border-l-4 border-cyan-500 p-4 rounded-lg">
          <h2 className="text-lg font-bold text-cyan-900 mb-1">
            💧 Gestión Diaria del Agua
          </h2>
          <p className="text-xs text-cyan-700">
            🧪 <strong>¿Quieres planificar antes de invertir?</strong>{" "}
            <Link
              href={ROUTES.AGUA_PLANIFICADOR}
              className="underline font-medium"
            >
              Usa el Planificador
            </Link>
          </p>
        </div>

        {/* Aviso zonas sin configurar */}
        {zonas.some(
          (z) => z.tipo === TIPO_ZONA.ESTANQUE && !z.estanque_config,
        ) && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ Detectamos zonas marcadas como &quot;estanque&quot; pero sin
              configuración. Por favor, edita estas zonas en el mapa y completa
              su configuración.
            </p>
          </div>
        )}

        {/* CAPA 1: Estado HOY — Hero */}
        <ResumenAgua
          aguaActual={aguaTotalActual}
          aguaMaxima={aguaTotalDisponible}
          consumoSemanal={consumoSemanal}
          onRegistrarAgua={() => setShowEntradaForm(true)}
          deshabilitarRegistro={estanques.length === 0}
          diasHastaRecarga={diasHastaRecarga}
          diasRestantesOverride={diasCritico}
        />

        {/* CAPA 2: Detalles colapsables */}
        {zonasConsumo.length > 0 && (
          <CollapsibleSection titulo="Ver consumo por zona">
            <div className="pt-2 space-y-2">
              {zonasConsumo.map(({ zona, consumo, porcentaje: pct }) => (
                <div
                  key={zona.id}
                  className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: zona.color }}
                    />
                    <span className="font-medium text-gray-700">
                      {zona.nombre}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {consumo.toFixed(2)} m³/sem
                    </div>
                    <div className="text-xs text-gray-500">
                      {pct.toFixed(0)}%
                    </div>
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-500 pt-1">
                Este cálculo se actualiza automáticamente según tus cultivos.
              </p>
            </div>
          </CollapsibleSection>
        )}

        {/* Cards por estanque (siempre, aunque sea 1 solo) */}
        <div className="space-y-3">
          {estanques.map((est) => (
            <EstanqueCardAgua
              key={est.id}
              estanque={est}
              resumen={diasPorEstanque.find((r) => r.estanqueId === est.id)}
              onConfigurarRecarga={() => {
                setEstanqueSeleccionadoId(est.id);
                setShowConfigRecarga(true);
              }}
            />
          ))}
        </div>

        {/* CAPA 3: Historial */}
        <HistorialAgua entradas={entradas} estanques={estanques} />
      </main>

      {showEntradaForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <EntradaAguaForm
              estanques={estanques}
              proveedores={proyectoActual?.proveedores_agua ?? []}
              onRegistrar={async (data) => {
                await registrarEntrada(data);
                setShowEntradaForm(false);
              }}
              onCancelar={() => setShowEntradaForm(false)}
            />
          </div>
        </div>
      )}

      {showConfigRecarga && estanqueActual && (
        <ConfigurarAguaModal
          estanque={estanqueActual}
          consumoSemanal={consumoEstanqueActual}
          onGuardar={async (config) => {
            if (!estanqueActual?.estanque_config) return;

            if (
              typeof config.frecuencia_dias !== "number" ||
              config.frecuencia_dias <= 0
            ) {
              logger.error(
                "Validación recarga fallida: frecuencia_dias debe ser mayor a 0",
              );
              return;
            }
            if (
              typeof config.cantidad_litros !== "number" ||
              config.cantidad_litros <= 0
            ) {
              logger.error(
                "Validación recarga fallida: cantidad_litros debe ser mayor a 0",
              );
              return;
            }

            const now = getCurrentTimestamp();
            const proximaRecarga = addDays(
              new Date(now),
              config.frecuencia_dias,
            ).toISOString();

            // Leer config fresca de BD para no sobrescribir nivel_actual_m3 con dato stale del closure
            const zonaFresca = await zonasDAL.getById(estanqueActual.id);
            const configFresca =
              zonaFresca?.estanque_config ?? estanqueActual.estanque_config;

            await ejecutarMutacion(
              () =>
                zonasDAL.update(estanqueActual.id, {
                  estanque_config: {
                    ...configFresca,
                    recarga: {
                      frecuencia_dias: config.frecuencia_dias,
                      cantidad_litros: config.cantidad_litros,
                      ultima_recarga: now,
                      proxima_recarga: proximaRecarga,
                      costo_recarga_clp: config.costo_recarga_clp,
                    },
                  },
                  updated_at: now,
                }),
              "configurar recarga estanque",
              async () => {
                emitZonaUpdated(estanqueActual.id);
                await refetch();
              },
            );
            setShowConfigRecarga(false);
          }}
          onQuitar={async () => {
            if (!estanqueActual?.estanque_config) return;

            const zonaFresca = await zonasDAL.getById(estanqueActual.id);
            const configFresca =
              zonaFresca?.estanque_config ?? estanqueActual.estanque_config;

            await ejecutarMutacion(
              () =>
                zonasDAL.update(estanqueActual.id, {
                  estanque_config: {
                    ...configFresca,
                    recarga: null,
                  },
                  updated_at: getCurrentTimestamp(),
                }),
              "quitar recarga estanque",
              async () => {
                emitZonaUpdated(estanqueActual.id);
                await refetch();
              },
            );
            setShowConfigRecarga(false);
          }}
          onCerrar={() => setShowConfigRecarga(false)}
        />
      )}
    </PageLayout>
  );
}
