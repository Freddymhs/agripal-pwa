"use client";

import { useState, useMemo } from "react";
import { CALIDAD_COSECHA_INFO } from "@/lib/constants/entities";
import { formatDate, formatCLP } from "@/lib/utils";
import type { Cosecha, Zona, CatalogoCultivo, UUID } from "@/types";

interface HistorialCosechasProps {
  cosechas: Cosecha[];
  zonas: Zona[];
  catalogoCultivos: CatalogoCultivo[];
  onEliminar: (id: UUID) => Promise<void>;
}

export function HistorialCosechas({
  cosechas,
  zonas,
  catalogoCultivos,
  onEliminar,
}: HistorialCosechasProps) {
  const [filtroZona, setFiltroZona] = useState("");
  const [filtroCultivo, setFiltroCultivo] = useState("");
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);

  const zonasMap = useMemo(
    () => new Map(zonas.map((z) => [z.id, z.nombre])),
    [zonas],
  );
  const cultivosMap = useMemo(
    () => new Map(catalogoCultivos.map((c) => [c.id, c.nombre])),
    [catalogoCultivos],
  );
  const getNombreZona = (id: string) => zonasMap.get(id) ?? "—";
  const getNombreCultivo = (id: string) => cultivosMap.get(id) ?? "—";

  const cosechasFiltradas = useMemo(() => {
    const ordenadas = [...cosechas].sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
    );

    return ordenadas.filter((c) => {
      if (filtroZona && c.zona_id !== filtroZona) return false;
      if (filtroCultivo && c.tipo_cultivo_id !== filtroCultivo) return false;
      return true;
    });
  }, [cosechas, filtroZona, filtroCultivo]);

  const { totalKg, totalIngreso } = useMemo(
    () => ({
      totalKg: cosechasFiltradas.reduce((s, c) => s + c.cantidad_kg, 0),
      totalIngreso: cosechasFiltradas.reduce(
        (s, c) =>
          s +
          (c.vendido && c.precio_venta_clp
            ? c.precio_venta_clp * c.cantidad_kg
            : 0),
        0,
      ),
    }),
    [cosechasFiltradas],
  );

  const zonasUnicas = useMemo(
    () => [...new Set(cosechas.map((c) => c.zona_id))],
    [cosechas],
  );
  const cultivosUnicos = useMemo(
    () => [...new Set(cosechas.map((c) => c.tipo_cultivo_id))],
    [cosechas],
  );

  const handleEliminar = async (id: string) => {
    if (!window.confirm("¿Eliminar este registro de cosecha?")) return;
    setEliminandoId(id);
    try {
      await onEliminar(id);
    } finally {
      setEliminandoId(null);
    }
  };

  if (cosechas.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <div className="text-4xl mb-2">🌾</div>
        <p className="text-gray-600 text-sm">
          No hay cosechas registradas aún.
        </p>
        <p className="text-gray-400 text-xs mt-1">
          Registra tu primera cosecha para comenzar a trackear resultados.
        </p>
        <div className="mt-4 flex flex-col items-center gap-1.5">
          <span className="text-xs text-gray-400">
            📊 Compara producción real vs proyectada
          </span>
          <span className="text-xs text-gray-400">
            💰 Calcula ingresos reales por zona
          </span>
          <span className="text-xs text-gray-400">
            📈 Detecta tendencias de rendimiento
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900">
            Historial de Cosechas
          </h3>
          <span className="text-xs text-gray-500">
            {cosechasFiltradas.length} registro
            {cosechasFiltradas.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex gap-2 flex-wrap">
          <select
            value={filtroZona}
            onChange={(e) => setFiltroZona(e.target.value)}
            className="border rounded-lg px-2 py-1 text-xs"
          >
            <option value="">Todas las zonas</option>
            {zonasUnicas.map((id) => (
              <option key={id} value={id}>
                {getNombreZona(id)}
              </option>
            ))}
          </select>

          <select
            value={filtroCultivo}
            onChange={(e) => setFiltroCultivo(e.target.value)}
            className="border rounded-lg px-2 py-1 text-xs"
          >
            <option value="">Todos los cultivos</option>
            {cultivosUnicos.map((id) => (
              <option key={id} value={id}>
                {getNombreCultivo(id)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 border-b">
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900">
            {totalKg.toLocaleString("es-CL", { maximumFractionDigits: 1 })} kg
          </div>
          <div className="text-xs text-gray-500">Total cosechado</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-emerald-700">
            {totalIngreso > 0 ? formatCLP(totalIngreso) : "—"}
          </div>
          <div className="text-xs text-gray-500">Ingreso por ventas</div>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {cosechasFiltradas.map((c) => {
          const calidadInfo = CALIDAD_COSECHA_INFO[c.calidad];
          return (
            <div key={c.id} className="p-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">
                      {getNombreCultivo(c.tipo_cultivo_id)}
                    </span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded font-medium ${calidadInfo.color}`}
                    >
                      {c.calidad}
                    </span>
                    <span className="text-xs text-gray-400">
                      {getNombreZona(c.zona_id)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>{formatDate(c.fecha)}</span>
                    <span className="font-medium text-gray-700">
                      {c.cantidad_kg} kg
                    </span>
                    {c.vendido && c.precio_venta_clp && (
                      <span className="text-emerald-600 font-medium">
                        {formatCLP(c.precio_venta_clp * c.cantidad_kg)}
                      </span>
                    )}
                  </div>
                  {c.notas && (
                    <p className="text-xs text-gray-400 mt-1 truncate">
                      {c.notas}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleEliminar(c.id)}
                  disabled={eliminandoId === c.id}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors p-1 disabled:opacity-50"
                  title="Eliminar"
                >
                  {eliminandoId === c.id ? "..." : "✕"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
