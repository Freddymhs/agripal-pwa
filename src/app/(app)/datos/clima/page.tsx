"use client";

import { useMemo, useState, useEffect } from "react";
import { PageLayout } from "@/components/layout";
import {
  PanelClima,
  ClimaRegionSelector,
  ClimaImpactoRiego,
} from "@/components/clima";
import { useProjectContext } from "@/contexts/project-context";
import { getTemporadaActual, type DatosETo } from "@/lib/data/clima";
import { calcularConsumoTerreno } from "@/lib/utils/agua";
import { FACTORES_TEMPORADA } from "@/lib/constants/entities";
import { ejecutarMutacion } from "@/lib/helpers/dal-mutation";
import { baseDataDAL } from "@/lib/dal";

export default function ClimaPage() {
  const { zonas, plantas, catalogoCultivos, datosBaseHook, proyectoActual } =
    useProjectContext();
  const [cambiandoClima, setCambiandoClima] = useState(false);
  const [climaActivoId, setClimaActivoId] = useState<string | undefined>(
    proyectoActual?.clima_base_id ?? undefined,
  );

  // Sincronizar si el proyecto cambia
  useEffect(() => {
    setClimaActivoId(proyectoActual?.clima_base_id ?? undefined);
  }, [proyectoActual?.clima_base_id]);

  const climas = datosBaseHook.datosBase.clima ?? [];
  const climaActivo =
    climas.find((c) => c.id === climaActivoId) ?? climas[0] ?? null;

  // ClimaBase extiende DatosClimaticos (sin campo dados anidado tras deserialización)
  const etoData = climaActivo?.evapotranspiracion_detalle;

  const temporada = getTemporadaActual();
  const factorTemporada = FACTORES_TEMPORADA[temporada];

  const consumoBase = useMemo(() => {
    if (plantas.length === 0) return 0;
    return calcularConsumoTerreno(zonas, plantas, catalogoCultivos, temporada);
  }, [zonas, plantas, catalogoCultivos, temporada]);

  const handleCambiarClima = async (climaId: string) => {
    if (!proyectoActual?.id || climaId === climaActivoId) return;
    setCambiandoClima(true);
    setClimaActivoId(climaId); // optimista
    try {
      await ejecutarMutacion(
        () => baseDataDAL.setClimaActivo(proyectoActual.id, climaId),
        "cambiar clima activo",
      );
    } catch {
      // Revertir si falla
      setClimaActivoId(proyectoActual.clima_base_id ?? climas[0]?.id);
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
