"use client";

import { useMemo } from "react";
import { useProjectContext } from "@/contexts/project-context";
import { TIPO_ZONA } from "@/lib/constants/entities";
import { M2_POR_HECTAREA } from "@/lib/constants/conversiones";
import {
  filtrarEstanques,
  calcularAguaPromedioHaAño,
  calcularPlantasPorHa,
  esCultivoCompleto,
} from "@/lib/utils/helpers-cultivo";
import { calcularROI, obtenerCostoAguaPromedio } from "@/lib/utils/roi";
import {
  DIAS_POR_AÑO,
  LITROS_POR_M3,
  RECARGAS_AÑO_FALLBACK,
} from "@/lib/constants/conversiones";
import { formatCLP } from "@/lib/utils";
import type { CatalogoCultivo } from "@/types";
import type { PrecioMayorista } from "@/lib/data/tipos-mercado";

interface FilaCapacidad {
  cultivo: CatalogoCultivo;
  maxPlantas: number;
  aguaPorPlantaAño: number;
  aguaTotalAño: number;
  inversionEstimada: number;
  roi5Pct: number;
  breakEvenMeses: number | null;
  precioKg: number;
}

export function SeccionCalculadorInverso() {
  const {
    terrenoActual: terreno,
    proyectoActual,
    zonas,
    catalogoCultivos,
    datosBaseHook,
  } = useProjectContext();

  const preciosMap = useMemo(() => {
    const map = new Map<string, PrecioMayorista>();
    for (const p of datosBaseHook.datosBase.precios) {
      map.set(p.cultivo_id, p);
    }
    return map;
  }, [datosBaseHook.datosBase.precios]);

  const precios = useMemo(
    () => datosBaseHook.datosBase.precios ?? [],
    [datosBaseHook.datosBase.precios],
  );
  const mercadoDetalle = useMemo(
    () => datosBaseHook.datosBase.mercadoDetalle ?? [],
    [datosBaseHook.datosBase.mercadoDetalle],
  );

  const estanques = useMemo(() => filtrarEstanques(zonas), [zonas]);

  const costoAguaM3 = useMemo(() => {
    if (!terreno || estanques.length === 0) return 0;
    return obtenerCostoAguaPromedio(estanques, terreno);
  }, [terreno, estanques]);

  // Agua disponible anual = suma de (capacidad_estanque × recargas_por_año)
  const aguaDisponibleAnual = useMemo(() => {
    if (estanques.length === 0) return 0;
    const totalM3 = estanques.reduce((acc, est) => {
      const cfg = est.estanque_config;
      if (!cfg) return acc;
      const recarga = cfg.recarga;
      if (
        recarga &&
        recarga.frecuencia_dias > 0 &&
        recarga.cantidad_litros > 0
      ) {
        return (
          acc +
          (recarga.cantidad_litros / LITROS_POR_M3) *
            (DIAS_POR_AÑO / recarga.frecuencia_dias)
        );
      }
      if (cfg.capacidad_m3 > 0)
        return acc + cfg.capacidad_m3 * RECARGAS_AÑO_FALLBACK;
      return acc;
    }, 0);
    return Math.round(totalM3);
  }, [estanques]);

  // Area cultivable total (zonas de cultivo)
  const areaCultivoM2 = useMemo(() => {
    return zonas
      .filter((z) => z.tipo === TIPO_ZONA.CULTIVO)
      .reduce((s, z) => s + (z.area_m2 || z.ancho * z.alto), 0);
  }, [zonas]);

  const cultivosCompletos = useMemo(
    () =>
      catalogoCultivos.filter((c) =>
        esCultivoCompleto(c, precios, mercadoDetalle),
      ),
    [catalogoCultivos, precios, mercadoDetalle],
  );

  // Crear zona ficticia para simulacion
  const zonaFicticia = useMemo(() => {
    const zonaCultivo = zonas.find((z) => z.tipo === TIPO_ZONA.CULTIVO);
    return zonaCultivo ?? null;
  }, [zonas]);

  const resultados = useMemo<FilaCapacidad[]>(() => {
    if (
      aguaDisponibleAnual <= 0 ||
      !zonaFicticia ||
      cultivosCompletos.length === 0
    )
      return [];

    const suelo = proyectoActual?.suelo ?? null;

    return cultivosCompletos
      .map((cultivo) => {
        const aguaHaAño = calcularAguaPromedioHaAño(cultivo);
        const plantasPorHa = calcularPlantasPorHa(
          cultivo.espaciado_recomendado_m,
        );
        if (plantasPorHa <= 0 || aguaHaAño <= 0) return null;

        const aguaPorPlanta = aguaHaAño / plantasPorHa;

        // Max plantas limitado por agua Y por area
        const maxPorAgua = Math.floor(aguaDisponibleAnual / aguaPorPlanta);
        const areaHa = areaCultivoM2 / M2_POR_HECTAREA;
        const maxPorArea = Math.floor(plantasPorHa * areaHa);
        const maxPlantas = Math.min(maxPorAgua, maxPorArea);

        if (maxPlantas <= 0) return null;

        const pm = preciosMap.get(cultivo.cultivo_base_id ?? "");
        const precioMayorista = pm?.precio_actual_clp ?? undefined;

        const roi = calcularROI(
          cultivo,
          zonaFicticia,
          maxPlantas,
          costoAguaM3,
          undefined,
          suelo,
          precioMayorista,
        );

        return {
          cultivo,
          maxPlantas,
          aguaPorPlantaAño: aguaPorPlanta,
          aguaTotalAño: maxPlantas * aguaPorPlanta,
          inversionEstimada: roi.inversion_total,
          roi5Pct: roi.roi_5_años_pct,
          breakEvenMeses: roi.punto_equilibrio_meses,
          precioKg: roi.precio_kg_estimado,
        } satisfies FilaCapacidad;
      })
      .filter((r): r is FilaCapacidad => r !== null)
      .sort((a, b) => b.roi5Pct - a.roi5Pct);
  }, [
    aguaDisponibleAnual,
    areaCultivoM2,
    cultivosCompletos,
    zonaFicticia,
    costoAguaM3,
    proyectoActual?.suelo,
    preciosMap,
  ]);

  if (!terreno || aguaDisponibleAnual <= 0) {
    return (
      <div className="text-sm text-gray-500 p-2">
        Configura estanques y recargas para ver cuantas plantas soporta tu agua.
      </div>
    );
  }

  if (resultados.length === 0) {
    return (
      <div className="text-sm text-gray-500 p-2">
        No hay cultivos disponibles para calcular.
      </div>
    );
  }

  const limitante = resultados[0]
    ? resultados[0].aguaTotalAño >= aguaDisponibleAnual * 0.95
      ? "agua"
      : "area"
    : null;

  return (
    <div className="space-y-3">
      {/* Resumen de capacidad */}
      <div className="flex gap-3">
        <div className="flex-1 bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-blue-700">
            {Math.round(aguaDisponibleAnual)} m3/año
          </div>
          <div className="text-xs text-blue-500">Agua disponible</div>
        </div>
        <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-gray-700">
            {Math.round(areaCultivoM2)} m2
          </div>
          <div className="text-xs text-gray-500">Area de cultivo</div>
        </div>
        <div className="flex-1 bg-purple-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-purple-700">
            {formatCLP(costoAguaM3)}/m3
          </div>
          <div className="text-xs text-purple-500">Costo agua</div>
        </div>
      </div>

      {limitante && (
        <p className="text-[10px] text-gray-400">
          Factor limitante:{" "}
          {limitante === "agua"
            ? "tu agua disponible limita la cantidad de plantas"
            : "tu area de cultivo limita la cantidad de plantas"}
        </p>
      )}

      {/* Tabla de resultados */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="p-2 text-xs font-medium text-gray-600">Cultivo</th>
              <th className="p-2 text-right text-xs font-medium text-gray-600">
                Max plantas
              </th>
              <th className="p-2 text-right text-xs font-medium text-gray-600">
                Agua/año
              </th>
              <th className="p-2 text-right text-xs font-medium text-gray-600">
                Inversion
              </th>
              <th className="p-2 text-right text-xs font-medium text-gray-600">
                ROI 5a
              </th>
              <th className="p-2 text-right text-xs font-medium text-gray-600">
                Recupera
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {resultados.map((r) => (
              <tr key={r.cultivo.id} className="hover:bg-gray-50">
                <td className="p-2">
                  <div className="text-xs font-medium text-gray-900">
                    {r.cultivo.nombre}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {formatCLP(r.precioKg)}/kg
                  </div>
                </td>
                <td className="p-2 text-right">
                  <span className="text-sm font-bold text-blue-700">
                    {r.maxPlantas}
                  </span>
                </td>
                <td className="p-2 text-right text-xs text-gray-600">
                  {Math.round(r.aguaTotalAño)} m3
                  <div className="text-[10px] text-gray-400">
                    {Math.round((r.aguaTotalAño / aguaDisponibleAnual) * 100)}%
                    de tu agua
                  </div>
                </td>
                <td className="p-2 text-right text-xs text-gray-700">
                  {formatCLP(r.inversionEstimada)}
                </td>
                <td className="p-2 text-right">
                  <span
                    className={`text-xs font-bold ${r.roi5Pct > 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {r.roi5Pct}%
                  </span>
                </td>
                <td className="p-2 text-right text-xs text-gray-600">
                  {r.breakEvenMeses != null ? `${r.breakEvenMeses}m` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-gray-400">
        Maximo de plantas si dedicaras TODA tu agua y area a un solo cultivo.
        ROI bruto (sin mano de obra ni insumos). Precio mayorista.
      </p>
    </div>
  );
}
