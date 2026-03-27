"use client";

import { useState, useMemo } from "react";
import { useProjectContext } from "@/contexts/project-context";
import { obtenerCostoAguaPromedio } from "@/lib/utils/roi";
import {
  compararCultivos,
  type EscenarioCultivo,
} from "@/lib/utils/comparador-cultivos";
import {
  TablaComparativa,
  GraficoRoiComparativo,
  RecomendacionEscenario,
} from "@/components/escenarios/tabla-comparativa";
import {
  filtrarEstanques,
  esCultivoCompleto,
} from "@/lib/utils/helpers-cultivo";
import { TIPO_ZONA } from "@/lib/constants/entities";
import type { CatalogoCultivo } from "@/types";

const COLORES_LINEA = ["text-blue-600", "text-green-600", "text-purple-600"];
const COLORES_BG = ["bg-blue-50", "bg-green-50", "bg-purple-50"];

export function SeccionEscenarios() {
  const {
    terrenoActual: terreno,
    proyectoActual,
    zonas,
    catalogoCultivos,
    datosBaseHook,
  } = useProjectContext();
  const [zonaId, setZonaId] = useState<string>("");
  const [seleccion, setSeleccion] = useState<string[]>([]);

  const rawPrecios = datosBaseHook.datosBase.precios;
  const rawMercadoDetalle = datosBaseHook.datosBase.mercadoDetalle;

  const precios = useMemo(() => rawPrecios ?? [], [rawPrecios]);
  const mercadoDetalle = useMemo(
    () => rawMercadoDetalle ?? [],
    [rawMercadoDetalle],
  );

  const preciosPorCultivoBase = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of precios) {
      if (p.precio_actual_clp) map.set(p.cultivo_id, p.precio_actual_clp);
    }
    return map;
  }, [precios]);

  const cultivosCompletos = useMemo(
    () =>
      catalogoCultivos.filter((c) =>
        esCultivoCompleto(c, precios, mercadoDetalle),
      ),
    [catalogoCultivos, precios, mercadoDetalle],
  );

  const [prevCultivosCompletos, setPrevCultivosCompletos] =
    useState(cultivosCompletos);
  const [prevZonas, setPrevZonas] = useState(zonas);

  if (zonas !== prevZonas || cultivosCompletos !== prevCultivosCompletos) {
    setPrevZonas(zonas);
    setPrevCultivosCompletos(cultivosCompletos);
    if (zonas.length > 0) {
      const zonaCultivo = zonas.find((zona) => zona.tipo === TIPO_ZONA.CULTIVO);
      const zonaIdValida = zonaId && zonas.some((z) => z.id === zonaId);
      if (zonaCultivo && !zonaIdValida) setZonaId(zonaCultivo.id);

      const seleccionValida =
        seleccion.length > 0 &&
        seleccion.every((id) => catalogoCultivos.some((c) => c.id === id));
      if (!seleccionValida) {
        if (cultivosCompletos.length >= 2)
          setSeleccion([cultivosCompletos[0].id, cultivosCompletos[1].id]);
        else if (cultivosCompletos.length === 1)
          setSeleccion([cultivosCompletos[0].id]);
        else setSeleccion([]);
      }
    }
  }

  const zonaSeleccionada = zonas.find((z) => z.id === zonaId) ?? null;

  const escenarios = useMemo<EscenarioCultivo[]>(() => {
    if (!zonaSeleccionada || !terreno || seleccion.length === 0) return [];
    const cultivosSelec = seleccion
      .map((id) => catalogoCultivos.find((c) => c.id === id))
      .filter((c): c is CatalogoCultivo => c != null);

    const estanques = filtrarEstanques(zonas);
    const costoAguaM3 = obtenerCostoAguaPromedio(estanques, terreno);

    return compararCultivos(
      cultivosSelec,
      zonaSeleccionada,
      proyectoActual?.suelo ?? null,
      costoAguaM3,
      undefined,
      preciosPorCultivoBase,
    );
  }, [
    zonaSeleccionada,
    terreno,
    seleccion,
    catalogoCultivos,
    zonas,
    proyectoActual?.suelo,
    preciosPorCultivoBase,
  ]);

  const toggleCultivo = (id: string) => {
    setSeleccion((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const zonasCultivo = zonas.filter((z) => z.tipo === TIPO_ZONA.CULTIVO);

  return (
    <div className="space-y-4">
      <p className="text-sm text-indigo-800 bg-indigo-50 border-l-4 border-indigo-500 p-3 rounded-lg">
        Compara hasta <strong>3 cultivos</strong> lado a lado para una zona.
      </p>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Zona a evaluar
          </label>
          <select
            value={zonaId}
            onChange={(e) => setZonaId(e.target.value)}
            className="w-full px-3 py-2 border rounded text-gray-900"
          >
            <option value="">Seleccionar zona...</option>
            {zonasCultivo.map((z) => (
              <option key={z.id} value={z.id}>
                {z.nombre} ({z.area_m2 || z.ancho * z.alto} m²)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cultivos a comparar ({seleccion.length}/3)
          </label>
          <div className="flex flex-wrap gap-2">
            {catalogoCultivos.map((c) => {
              const idx = seleccion.indexOf(c.id);
              const selected = idx >= 0;
              const completo = esCultivoCompleto(c, precios, mercadoDetalle);
              return (
                <button
                  key={c.id}
                  onClick={() => completo && toggleCultivo(c.id)}
                  disabled={!completo}
                  title={
                    !completo
                      ? "Sin datos de mercado — no disponible para comparar"
                      : undefined
                  }
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    !completo
                      ? "bg-amber-50 text-amber-400 border border-amber-200 cursor-not-allowed opacity-60"
                      : selected
                        ? `${COLORES_BG[idx]} ${COLORES_LINEA[idx]} ring-2 ring-current`
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {!completo && <span className="mr-1">⚠</span>}
                  {c.nombre}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {escenarios.length >= 2 && (
        <>
          <TablaComparativa escenarios={escenarios} />
          <GraficoRoiComparativo escenarios={escenarios} />
          <RecomendacionEscenario escenarios={escenarios} />
        </>
      )}

      {escenarios.length < 2 && seleccion.length < 2 && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <p className="text-yellow-800 text-sm">
            Selecciona al menos 2 cultivos y una zona para comparar.
          </p>
        </div>
      )}
    </div>
  );
}
