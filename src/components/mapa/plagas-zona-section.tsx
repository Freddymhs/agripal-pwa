"use client";

import { useMemo } from "react";
import type { CatalogoCultivo, EtapaCrecimiento, Planta } from "@/types";
import type { DatosClimaticos } from "@/lib/data/calculos-clima";
import {
  evaluarRiesgoPlagas,
  SCORE_RIESGO_MAX,
  type RiesgoPlaga,
} from "@/lib/utils/riesgo-plagas";
import { ESTADO_PLANTA } from "@/lib/constants/entities";

const BADGE: Record<RiesgoPlaga["alertaNivel"], string> = {
  bajo: "bg-green-100 text-green-800",
  medio: "bg-yellow-100 text-yellow-800",
  alto: "bg-orange-100 text-orange-800",
  critico: "bg-red-100 text-red-800",
};

interface Props {
  plantas: Planta[];
  catalogoCultivos: CatalogoCultivo[];
  climaDatos: DatosClimaticos | undefined;
}

export function PlagasZonaSection({
  plantas,
  catalogoCultivos,
  climaDatos,
}: Props) {
  const riesgos = useMemo(() => {
    const vivas = plantas.filter((p) => p.estado !== ESTADO_PLANTA.MUERTA);
    if (vivas.length === 0 || !climaDatos) return [];

    const porTipo = new Map<
      string,
      { cultivo: CatalogoCultivo; etapa: EtapaCrecimiento }
    >();
    for (const p of vivas) {
      if (!porTipo.has(p.tipo_cultivo_id)) {
        const cultivo = catalogoCultivos.find(
          (c) => c.id === p.tipo_cultivo_id,
        );
        if (cultivo)
          porTipo.set(p.tipo_cultivo_id, { cultivo, etapa: p.etapa_actual });
      }
    }

    return Array.from(porTipo.values()).flatMap(({ cultivo, etapa }) =>
      evaluarRiesgoPlagas(cultivo, etapa, climaDatos).map((r) => ({
        ...r,
        cultivoNombre: cultivo.nombre,
      })),
    );
  }, [plantas, catalogoCultivos, climaDatos]);

  if (riesgos.length === 0) {
    return (
      <p className="text-xs text-gray-400 px-1">
        Sin plagas registradas para los cultivos de esta zona.
      </p>
    );
  }

  const alertasActivas = riesgos.filter((r) => r.alertaNivel !== "bajo");

  return (
    <div className="space-y-2">
      {alertasActivas.length === 0 && (
        <p className="text-xs text-green-700 bg-green-50 rounded p-2">
          Sin riesgos altos — condiciones favorables.
        </p>
      )}
      {riesgos.map((r, i) => (
        <div
          key={i}
          className={`flex items-center justify-between p-2 rounded text-xs ${BADGE[r.alertaNivel]}`}
        >
          <div className="min-w-0">
            <span className="font-medium">{r.plaga.nombre}</span>
            <span className="text-[10px] ml-1 opacity-70">
              ({r.cultivoNombre})
            </span>
          </div>
          <span className="font-bold shrink-0 ml-2">
            {r.alertaNivel.toUpperCase()} {r.scoreRiesgo}/{SCORE_RIESGO_MAX}
          </span>
        </div>
      ))}
    </div>
  );
}
