"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  calcularConsumoZona,
  calcularConsumoRiegoZona,
  calcularStockEstanques,
} from "@/lib/utils/agua";
import { clamp } from "@/lib/utils/math";
import { formatCLP } from "@/lib/utils";
import { FUENTES_AGUA_ARICA } from "@/lib/data/fuentes-agua";
import { evaluarCompatibilidadMultiple } from "@/lib/validations/agua";
import type { Zona, Planta, CatalogoCultivo, UUID, FuenteAgua } from "@/types";
import { DIAS_POR_SEMANA } from "@/lib/constants/conversiones";
import { TIPO_ZONA, ESTADO_PLANTA } from "@/lib/constants/entities";
import { EstanqueCompatibilidad } from "./estanque-compatibilidad";
import { EstanqueConsumoZonas } from "./estanque-consumo-zonas";

import { ROUTES } from "@/lib/constants/routes";

interface EstanquePanelProps {
  estanque: Zona;
  zonas: Zona[];
  plantas: Planta[];
  catalogoCultivos: CatalogoCultivo[];
  onAbrirFormularioAgua: (estanqueId: UUID) => void;
  onCambiarFuente?: (estanqueId: UUID, fuenteId: string) => Promise<void>;
}

function TooltipIcon({
  text,
  variant = "default",
}: {
  text: string;
  variant?: "default" | "warning" | "ok";
}) {
  const [show, setShow] = useState(false);
  const colors =
    variant === "warning"
      ? "bg-amber-500 text-white hover:bg-amber-600"
      : variant === "ok"
        ? "bg-blue-200 text-blue-600 hover:bg-blue-300"
        : "bg-gray-200 text-gray-500 hover:bg-gray-300";
  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <button
        type="button"
        className={`w-3.5 h-3.5 rounded-full text-[10px] leading-none flex items-center justify-center ${colors}`}
        aria-label={text}
      >
        i
      </button>
      {show && (
        <div className="absolute right-0 top-4 z-40 max-w-xs bg-white border border-gray-200 rounded-lg shadow-lg p-2 text-[11px] text-gray-700 whitespace-normal break-words">
          {text}
        </div>
      )}
    </div>
  );
}

export function EstanquePanel({
  estanque,
  zonas,
  plantas,
  catalogoCultivos,
  onAbrirFormularioAgua,
  onCambiarFuente,
}: EstanquePanelProps) {
  const config = estanque.estanque_config;

  // Todos los hooks ANTES del early return (regla de React: no hooks condicionales)
  const zonasCultivo = useMemo(
    () => zonas.filter((z) => z.tipo === TIPO_ZONA.CULTIVO),
    [zonas],
  );

  const consumoPorZona = useMemo(() => {
    return zonasCultivo
      .map((zona) => {
        const plantasZona = plantas.filter(
          (p) => p.zona_id === zona.id && p.estado !== ESTADO_PLANTA.MUERTA,
        );
        const consumoRecomendado = calcularConsumoZona(
          zona,
          plantasZona,
          catalogoCultivos,
        );
        const consumoRiego = calcularConsumoRiegoZona(zona);
        const consumoEfectivo =
          consumoRiego > 0 ? consumoRiego : consumoRecomendado;
        const tipos = new Set(plantasZona.map((p) => p.tipo_cultivo_id));
        const cultivoNombre =
          tipos.size === 1
            ? (catalogoCultivos.find((c) => c.id === [...tipos][0])?.nombre ??
              "?")
            : tipos.size > 1
              ? "Mixto"
              : "Vacía";
        return {
          zona,
          plantasCount: plantasZona.length,
          consumoRecomendado,
          consumoRiego,
          consumoEfectivo,
          cultivoNombre,
        };
      })
      .filter((z) => z.plantasCount > 0);
  }, [zonasCultivo, plantas, catalogoCultivos]);

  const todosEstanques = useMemo(
    () =>
      zonas.filter((z) => z.tipo === TIPO_ZONA.ESTANQUE && z.estanque_config),
    [zonas],
  );

  const stockTotal = useMemo(
    () => calcularStockEstanques(todosEstanques),
    [todosEstanques],
  );

  const cultivosActivos = useMemo(() => {
    const ids = new Set<string>();
    for (const p of plantas) {
      if (p.estado !== ESTADO_PLANTA.MUERTA) ids.add(p.tipo_cultivo_id);
    }
    return catalogoCultivos.filter((c) => ids.has(c.id));
  }, [plantas, catalogoCultivos]);

  const fuenteActual: FuenteAgua | null = useMemo(() => {
    if (!config?.fuente_id) return null;
    return FUENTES_AGUA_ARICA.find((f) => f.id === config.fuente_id) ?? null;
  }, [config]);

  const compatibilidades = useMemo(() => {
    if (!fuenteActual || cultivosActivos.length === 0) return [];
    return evaluarCompatibilidadMultiple(fuenteActual, cultivosActivos);
  }, [fuenteActual, cultivosActivos]);

  if (!config) return null;

  const aguaActualM3 = config.nivel_actual_m3;
  const porcentaje =
    config.capacidad_m3 > 0 ? (aguaActualM3 / config.capacidad_m3) * 100 : 0;
  const espacioDisponible = config.capacidad_m3 - aguaActualM3;
  const colorBarra =
    porcentaje > 50
      ? "bg-cyan-500"
      : porcentaje > 20
        ? "bg-yellow-500"
        : "bg-red-500";

  const consumoTotal = consumoPorZona.reduce(
    (sum, z) => sum + z.consumoEfectivo,
    0,
  );

  const diasRestantes =
    consumoTotal > 0
      ? stockTotal.aguaTotal / (consumoTotal / DIAS_POR_SEMANA)
      : Infinity;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-cyan-800">Estanque de Agua</h4>
        <Link
          href={ROUTES.AGUA}
          className="text-xs text-cyan-600 hover:text-cyan-800 font-medium flex items-center gap-1"
        >
          ⚙️ Configurar
        </Link>
      </div>

      <div className="bg-cyan-50 p-3 rounded-lg space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-cyan-700">Nivel actual</span>
          <span className="font-bold text-cyan-900">
            {aguaActualM3.toFixed(1)} / {config.capacidad_m3} m³
          </span>
        </div>
        <div className="h-4 bg-cyan-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${colorBarra} transition-all`}
            style={{ width: `${clamp(porcentaje, 0, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-cyan-600">
          <span>{porcentaje.toFixed(0)}%</span>
          <span>Espacio: {espacioDisponible.toFixed(1)} m³</span>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-medium text-gray-700">
            Fuente de agua
          </label>
          {!fuenteActual ? (
            <>
              <TooltipIcon
                variant="warning"
                text="No hay fuente de agua configurada. La app usa valores estándar y no puede evaluar bien boro, salinidad ni costo real por m³. Asigna Lluta, Azapa, aljibe, etc. para tener un riesgo más realista."
              />
              <span className="text-[10px] font-medium text-amber-600">
                Sin fuente
              </span>
            </>
          ) : (
            <TooltipIcon
              variant="ok"
              text="Usando la fuente seleccionada para calcular calidad de agua (boro, salinidad, pH) y costo real por m³."
            />
          )}
        </div>
        <select
          value={config.fuente_id || ""}
          onChange={async (e) => {
            if (onCambiarFuente)
              await onCambiarFuente(estanque.id, e.target.value);
          }}
          className="w-full px-2 py-1.5 border rounded text-sm text-gray-900"
        >
          <option value="">Sin asignar</option>
          {FUENTES_AGUA_ARICA.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nombre}
            </option>
          ))}
        </select>
        {!fuenteActual && (
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-2.5 space-y-1">
            <p className="text-xs font-bold text-amber-800">
              ⚠️ Fuente de agua no configurada
            </p>
            <p className="text-[11px] text-amber-700">
              Este estanque no tiene fuente de agua asignada. Los cálculos de
              calidad (boro, salinidad, pH) y costo del agua se basan en valores
              estándar o quedan incompletos. Asigna una fuente para tener
              riesgos y costos reales.
            </p>
          </div>
        )}
        {fuenteActual && (
          <div className="space-y-1.5">
            <div className="grid grid-cols-3 gap-1 text-xs">
              {fuenteActual.boro_ppm != null && (
                <div className="bg-gray-50 p-1.5 rounded text-center">
                  <div className="text-gray-500">Boro</div>
                  <div className="font-medium text-gray-900">
                    {fuenteActual.boro_ppm} ppm
                  </div>
                </div>
              )}
              {fuenteActual.salinidad_dS_m != null && (
                <div className="bg-gray-50 p-1.5 rounded text-center">
                  <div className="text-gray-500">Salinidad</div>
                  <div className="font-medium text-gray-900">
                    {fuenteActual.salinidad_dS_m} dS/m
                  </div>
                </div>
              )}
              {fuenteActual.ph != null && (
                <div className="bg-gray-50 p-1.5 rounded text-center">
                  <div className="text-gray-500">pH</div>
                  <div className="font-medium text-gray-900">
                    {fuenteActual.ph}
                  </div>
                </div>
              )}
            </div>
            {fuenteActual.costo_m3_clp != null &&
              fuenteActual.costo_m3_clp > 0 && (
                <div className="text-xs text-gray-500">
                  Costo: {formatCLP(fuenteActual.costo_m3_clp)}/m³
                </div>
              )}
            {fuenteActual.notas && (
              <p className="text-xs text-gray-500 italic">
                {fuenteActual.notas}
              </p>
            )}
          </div>
        )}
      </div>

      <EstanqueCompatibilidad compatibilidades={compatibilidades} />

      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200 rounded-lg p-4">
        <button
          onClick={() => onAbrirFormularioAgua(estanque.id)}
          className="w-full bg-cyan-600 text-white py-3 rounded-lg hover:bg-cyan-700 font-medium flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Registrar Entrada de Agua
        </button>
        <p className="text-xs text-cyan-700 text-center mt-2">
          Incluye costo, proveedor y notas para economía
        </p>
      </div>

      <EstanqueConsumoZonas
        consumoPorZona={consumoPorZona}
        consumoTotal={consumoTotal}
        diasRestantes={diasRestantes}
      />

      {config.material && (
        <div className="text-xs text-gray-500">Material: {config.material}</div>
      )}
    </div>
  );
}
