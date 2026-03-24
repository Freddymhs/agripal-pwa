"use client";

import { useMemo, useState, useEffect } from "react";
import { PageLayout } from "@/components/layout";
import {
  PanelClima,
  ClimaRegionSelector,
  ClimaImpactoRiego,
} from "@/components/clima";
import { useProjectContext } from "@/contexts/project-context";
import { getTemporadaActual } from "@/lib/data/calculos-clima";
import { calcularConsumoTerreno } from "@/lib/utils/agua";
import { FACTORES_TEMPORADA } from "@/lib/constants/entities";
import { ejecutarMutacion } from "@/lib/helpers/dal-mutation";
import { baseDataDAL } from "@/lib/dal";

export default function ClimaPage() {
  const {
    zonas,
    plantas,
    catalogoCultivos,
    datosBaseHook,
    proyectoActual,
    opcionesConsumoAgua,
  } = useProjectContext();
  const [cambiandoClima, setCambiandoClima] = useState(false);
  const [climaActivoId, setClimaActivoId] = useState<string | undefined>(
    proyectoActual?.clima_actual_id ?? undefined,
  );

  // Sincronizar si el proyecto cambia
  useEffect(() => {
    setClimaActivoId(proyectoActual?.clima_actual_id ?? undefined);
  }, [proyectoActual?.clima_actual_id]);

  const climas = datosBaseHook.datosBase.clima ?? [];
  const climaActivo = climas.find((c) => c.id === climaActivoId) ?? null;

  // ClimaBase extiende DatosClimaticos (sin campo dados anidado tras deserialización)
  const etoData = climaActivo?.evapotranspiracion_detalle;

  const temporada = getTemporadaActual();
  const factorTemporada = FACTORES_TEMPORADA[temporada];

  const consumoBase = useMemo(() => {
    if (plantas.length === 0) return 0;
    return calcularConsumoTerreno(
      zonas,
      plantas,
      catalogoCultivos,
      temporada,
      opcionesConsumoAgua,
    );
  }, [zonas, plantas, catalogoCultivos, temporada, opcionesConsumoAgua]);

  const handleCambiarClima = async (climaId: string) => {
    if (!proyectoActual?.id) return;
    const nuevoId = climaId === climaActivoId ? null : climaId;
    setCambiandoClima(true);
    setClimaActivoId(nuevoId ?? undefined); // optimista
    try {
      await ejecutarMutacion(
        () => baseDataDAL.setClimaActivo(proyectoActual.id, nuevoId),
        "cambiar clima activo",
      );
    } catch {
      setClimaActivoId(proyectoActual.clima_actual_id ?? undefined); // revertir
    } finally {
      setCambiandoClima(false);
    }
  };

  return (
    <PageLayout headerColor="green">
      <main className="max-w-2xl mx-auto p-4 space-y-4">
        {climas.length > 0 && (
          <ClimaRegionSelector
            climas={climas}
            climaActivoId={climaActivoId}
            cambiandoClima={cambiandoClima}
            onCambiarClima={handleCambiarClima}
          />
        )}

        {!etoData && (
          <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg">
            No hay datos de evapotranspiración configurados para esta región.
          </div>
        )}

        {etoData && (
          <ClimaImpactoRiego
            etoData={etoData}
            consumoBase={consumoBase}
            factorTemporada={factorTemporada}
          />
        )}

        <PanelClima />
      </main>
    </PageLayout>
  );
}
