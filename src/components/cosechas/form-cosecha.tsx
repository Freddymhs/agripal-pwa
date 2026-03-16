"use client";

import { useState, useMemo } from "react";
import {
  TIPO_ZONA,
  CALIDAD_COSECHA_LIST,
  CALIDAD_COSECHA_INFO,
  DESTINO_COSECHA,
  DESTINO_COSECHA_LABELS,
  UMBRAL_VIDA_UTIL_URGENTE_DIAS,
} from "@/lib/constants/entities";
import type {
  Zona,
  CatalogoCultivo,
  Planta,
  CalidadCosecha,
  Cosecha,
} from "@/types";
import { addDays, format } from "date-fns";
import { es } from "date-fns/locale";

interface FormCosechaProps {
  zonas: Zona[];
  plantas: Planta[];
  catalogoCultivos: CatalogoCultivo[];
  onSubmit: (data: {
    zona_id: string;
    tipo_cultivo_id: string;
    fecha: string;
    cantidad_kg: number;
    calidad: CalidadCosecha;
    vendido: boolean;
    precio_venta_clp?: number;
    destino?: string;
    notas?: string;
  }) => Promise<Cosecha>;
  onCancel: () => void;
}

interface PostRegistroInfo {
  cosecha: Cosecha;
  cultivoNombre: string;
  vidaUtilDias: number | null;
}

export function FormCosecha({
  zonas,
  plantas,
  catalogoCultivos,
  onSubmit,
  onCancel,
}: FormCosechaProps) {
  const [zonaId, setZonaId] = useState("");
  const [tipoCultivoId, setTipoCultivoId] = useState("");
  const [fecha, setFecha] = useState(format(new Date(), "yyyy-MM-dd"));
  const [cantidadKg, setCantidadKg] = useState("");
  const [calidad, setCalidad] = useState<CalidadCosecha>("A");
  const [vendido, setVendido] = useState(false);
  const [precioVenta, setPrecioVenta] = useState("");
  const [destino, setDestino] = useState<string>(DESTINO_COSECHA.VENTA_LOCAL);
  const [notas, setNotas] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [postRegistro, setPostRegistro] = useState<PostRegistroInfo | null>(
    null,
  );

  const zonasCultivo = useMemo(
    () => zonas.filter((z) => z.tipo === TIPO_ZONA.CULTIVO),
    [zonas],
  );

  const cultivosEnZona = useMemo(() => {
    if (!zonaId) return [];
    const plantasZona = plantas.filter((p) => p.zona_id === zonaId);
    const cultivoIds = [...new Set(plantasZona.map((p) => p.tipo_cultivo_id))];
    return catalogoCultivos.filter((c) => cultivoIds.includes(c.id));
  }, [zonaId, plantas, catalogoCultivos]);

  const handleZonaChange = (id: string) => {
    setZonaId(id);
    setTipoCultivoId("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const kg = parseFloat(cantidadKg);
    if (!zonaId || !tipoCultivoId || !fecha || isNaN(kg) || kg <= 0) {
      setError("Completa zona, cultivo, fecha y cantidad (> 0 kg).");
      return;
    }

    setSubmitting(true);
    try {
      const cosecha = await onSubmit({
        zona_id: zonaId,
        tipo_cultivo_id: tipoCultivoId,
        fecha,
        cantidad_kg: kg,
        calidad,
        vendido,
        precio_venta_clp: vendido
          ? parseFloat(precioVenta) || undefined
          : undefined,
        destino: vendido ? destino : undefined,
        notas: notas || undefined,
      });

      const cultivo = catalogoCultivos.find((c) => c.id === tipoCultivoId);
      const vidaUtilDias = cultivo?.produccion?.vida_util_dias ?? null;

      setPostRegistro({
        cosecha,
        cultivoNombre: cultivo?.nombre ?? "Cultivo",
        vidaUtilDias,
      });
    } catch {
      setError("Error al registrar la cosecha. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (postRegistro) {
    const { cultivoNombre, vidaUtilDias, cosecha } = postRegistro;
    const esUrgente =
      vidaUtilDias !== null && vidaUtilDias <= UMBRAL_VIDA_UTIL_URGENTE_DIAS;
    const fechaVencimiento =
      vidaUtilDias !== null
        ? format(
            addDays(new Date(cosecha.fecha), vidaUtilDias),
            "d 'de' MMMM",
            {
              locale: es,
            },
          )
        : null;

    return (
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="text-center">
          <div className="text-4xl mb-2">{esUrgente ? "⚠️" : "✅"}</div>
          <h3 className="text-lg font-bold text-gray-900">
            Cosecha registrada
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {cosecha.cantidad_kg} kg de {cultivoNombre} — Calidad{" "}
            {cosecha.calidad}
          </p>
        </div>

        {vidaUtilDias !== null && (
          <div
            className={`p-4 rounded-lg border ${
              esUrgente
                ? "bg-red-50 border-red-200"
                : "bg-green-50 border-green-200"
            }`}
          >
            <p
              className={`text-sm font-medium ${
                esUrgente ? "text-red-800" : "text-green-800"
              }`}
            >
              {esUrgente ? "⏰ Vida útil corta" : "📦 Vida útil"}
            </p>
            <p
              className={`text-2xl font-bold mt-1 ${
                esUrgente ? "text-red-900" : "text-green-900"
              }`}
            >
              {vidaUtilDias} días sin refrigeración
            </p>
            <p
              className={`text-xs mt-1 ${
                esUrgente ? "text-red-700" : "text-green-700"
              }`}
            >
              {esUrgente
                ? `Vende o consume antes del ${fechaVencimiento}`
                : `Se mantiene hasta el ${fechaVencimiento}`}
            </p>
          </div>
        )}

        <button
          onClick={onCancel}
          className="w-full py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors text-sm font-medium"
        >
          Volver al historial
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg shadow p-4 space-y-4"
    >
      <h3 className="text-lg font-bold text-gray-900">Registrar Cosecha</h3>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Zona
          </label>
          <select
            value={zonaId}
            onChange={(e) => handleZonaChange(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            required
          >
            <option value="">Seleccionar zona</option>
            {zonasCultivo.map((z) => (
              <option key={z.id} value={z.id}>
                {z.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cultivo
          </label>
          <select
            value={tipoCultivoId}
            onChange={(e) => setTipoCultivoId(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            required
            disabled={!zonaId}
          >
            <option value="">
              {zonaId ? "Seleccionar cultivo" : "Elige zona primero"}
            </option>
            {cultivosEnZona.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de cosecha
          </label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cantidad (kg)
          </label>
          <input
            type="number"
            value={cantidadKg}
            onChange={(e) => setCantidadKg(e.target.value)}
            placeholder="0"
            min="0.1"
            step="0.1"
            className="w-full border rounded-lg px-3 py-2 text-sm"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Calidad
        </label>
        <div className="flex gap-2">
          {CALIDAD_COSECHA_LIST.map((cal) => {
            const info = CALIDAD_COSECHA_INFO[cal];
            const selected = calidad === cal;
            return (
              <button
                key={cal}
                type="button"
                onClick={() => setCalidad(cal)}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                  selected
                    ? `${info.color} border-current ring-1 ring-current`
                    : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {cal} — {info.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t pt-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={vendido}
            onChange={(e) => setVendido(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">
            Vendiste esta cosecha
          </span>
        </label>

        {vendido && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio venta (CLP/kg)
              </label>
              <input
                type="number"
                value={precioVenta}
                onChange={(e) => setPrecioVenta(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destino
              </label>
              <select
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                {Object.entries(DESTINO_COSECHA_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notas (opcional)
        </label>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={2}
          placeholder="Observaciones de la cosecha..."
          className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
        >
          {submitting ? "Registrando..." : "Registrar cosecha"}
        </button>
      </div>
    </form>
  );
}
