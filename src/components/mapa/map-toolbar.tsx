"use client";

import { useProjectContext } from "@/contexts/project-context";
import { useMapContext } from "@/contexts/map-context";
import { MODO, TIPO_ZONA } from "@/lib/constants/entities";

export function MapToolbar() {
  const { catalogoCultivos } = useProjectContext();
  const {
    modo,
    setModo,
    zonaSeleccionada,
    setPlantaSeleccionada,
    setPlantasSeleccionadas,
    setZonaSeleccionada,
    cultivoSeleccionado,
    setCultivoSeleccionado,
    setShowGridModal,
  } = useMapContext();

  return (
    <div className="bg-white border-b px-4 py-2 flex items-center gap-2 flex-wrap">
      <span className="text-sm text-gray-500 mr-2">Modos:</span>

      <button
        onClick={() => {
          setModo(MODO.TERRENO);
          setZonaSeleccionada(null);
          setPlantaSeleccionada(null);
          setPlantasSeleccionadas([]);
        }}
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          modo === MODO.TERRENO
            ? "bg-blue-500 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        🏞️ Terreno
      </button>

      <button
        onClick={() => {
          setModo(MODO.ZONAS);
          setPlantaSeleccionada(null);
          setPlantasSeleccionadas([]);
        }}
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          modo === MODO.ZONAS
            ? "bg-green-500 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        📦 Zonas
      </button>

      <button
        onClick={() => {
          setModo(MODO.PLANTAS);
          setZonaSeleccionada(null);
        }}
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          modo === MODO.PLANTAS
            ? "bg-emerald-500 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        🌱 Editar Planta
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button
        onClick={() => {
          setModo(MODO.ESPACIADO);
          setZonaSeleccionada(null);
          setPlantaSeleccionada(null);
          setPlantasSeleccionadas([]);
        }}
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          modo === MODO.ESPACIADO
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        📋 Plano Tecnico
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button
        onClick={() => {
          setModo(MODO.CREAR_ZONA);
          setZonaSeleccionada(null);
          setPlantaSeleccionada(null);
          setPlantasSeleccionadas([]);
        }}
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          modo === MODO.CREAR_ZONA
            ? "bg-green-500 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        + Nueva Zona
      </button>

      <button
        onClick={() => {
          setModo(MODO.PLANTAR);
          setPlantaSeleccionada(null);
          setPlantasSeleccionadas([]);
        }}
        disabled={
          modo !== MODO.ZONAS ||
          !zonaSeleccionada ||
          zonaSeleccionada.tipo !== TIPO_ZONA.CULTIVO
        }
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          modo === MODO.PLANTAR
            ? "bg-lime-500 text-white"
            : modo === MODO.ZONAS &&
                zonaSeleccionada?.tipo === TIPO_ZONA.CULTIVO
              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
      >
        🌾 Individual
      </button>

      <button
        onClick={() => setShowGridModal(true)}
        disabled={
          (modo !== MODO.ZONAS && modo !== MODO.PLANTAR) ||
          !zonaSeleccionada ||
          zonaSeleccionada.tipo !== TIPO_ZONA.CULTIVO ||
          !cultivoSeleccionado
        }
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          (modo === MODO.ZONAS || modo === MODO.PLANTAR) &&
          zonaSeleccionada?.tipo === TIPO_ZONA.CULTIVO &&
          cultivoSeleccionado
            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
      >
        🌾 En Grilla
      </button>

      {modo === MODO.CREAR_ZONA && (
        <span className="text-sm text-green-600 ml-2">
          Dibuja un rectángulo en el mapa
        </span>
      )}

      {(modo === MODO.ZONAS || modo === MODO.PLANTAR) &&
        zonaSeleccionada?.tipo === TIPO_ZONA.CULTIVO && (
          <div className="flex items-center gap-2 flex-wrap bg-lime-50 px-3 py-2 rounded-lg border border-lime-200">
            <span className="text-sm font-medium text-lime-800">Cultivo:</span>
            <select
              value={cultivoSeleccionado?.id ?? ""}
              onChange={(e) => {
                const cultivo = catalogoCultivos.find(
                  (c) => c.id === e.target.value,
                );
                if (cultivo) setCultivoSeleccionado(cultivo);
              }}
              className="px-2 py-1 rounded text-sm border border-lime-300 text-gray-900 bg-white"
            >
              {!cultivoSeleccionado && (
                <option value="" disabled>
                  Seleccionar cultivo…
                </option>
              )}
              {catalogoCultivos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            {cultivoSeleccionado && (
              <span className="text-xs text-lime-700 bg-lime-100 px-2 py-1 rounded">
                Espacio: {cultivoSeleccionado.espaciado_recomendado_m}m
              </span>
            )}

            {modo === MODO.PLANTAR && (
              <>
                <span className="text-lime-800">→</span>
                {zonaSeleccionada.tipo === TIPO_ZONA.CULTIVO ? (
                  <span className="text-sm text-lime-800 font-medium">
                    Haz click DENTRO de &quot;{zonaSeleccionada.nombre}&quot;
                    para colocar 1 planta
                  </span>
                ) : (
                  <span className="text-sm text-red-700 bg-red-100 px-2 py-1 rounded font-medium">
                    &quot;{zonaSeleccionada.nombre}&quot; no es cultivo. Haz
                    click en una zona VERDE.
                  </span>
                )}
              </>
            )}
          </div>
        )}
    </div>
  );
}
