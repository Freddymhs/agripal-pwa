"use client";

import { useProjectContext } from "@/contexts/project-context";
import { useMapContext } from "@/contexts/map-context";
import { TIPO_ZONA } from "@/lib/constants/entities";

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
  } = useMapContext();

  return (
    <div className="bg-white border-b px-4 py-2 flex items-center gap-2 flex-wrap">
      <span className="text-sm text-gray-500 mr-2">Modos:</span>

      <button
        onClick={() => {
          setModo("terreno");
          setZonaSeleccionada(null);
          setPlantaSeleccionada(null);
          setPlantasSeleccionadas([]);
        }}
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          modo === "terreno"
            ? "bg-blue-500 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        🏞️ Terreno
      </button>

      <button
        onClick={() => {
          setModo("zonas");
          setPlantaSeleccionada(null);
          setPlantasSeleccionadas([]);
        }}
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          modo === "zonas"
            ? "bg-green-500 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        📦 Zonas
      </button>

      <button
        onClick={() => {
          setModo("plantas");
          setZonaSeleccionada(null);
        }}
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          modo === "plantas"
            ? "bg-emerald-500 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        🌱 Plantas
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button
        onClick={() => {
          setModo("crear_zona");
          setZonaSeleccionada(null);
          setPlantaSeleccionada(null);
          setPlantasSeleccionadas([]);
        }}
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          modo === "crear_zona"
            ? "bg-green-500 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        + Nueva Zona
      </button>

      <button
        onClick={() => {
          setModo("plantar");
          setPlantaSeleccionada(null);
          setPlantasSeleccionadas([]);
        }}
        disabled={
          modo !== "zonas" ||
          !zonaSeleccionada ||
          zonaSeleccionada.tipo !== TIPO_ZONA.CULTIVO
        }
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          modo === "plantar"
            ? "bg-lime-500 text-white"
            : modo === "zonas" && zonaSeleccionada?.tipo === TIPO_ZONA.CULTIVO
              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
      >
        🌾 Plantar
      </button>

      {modo === "crear_zona" && (
        <span className="text-sm text-green-600 ml-2">
          Dibuja un rectángulo en el mapa
        </span>
      )}

      {modo === "plantar" && (
        <div className="flex items-center gap-2 flex-wrap bg-lime-50 px-3 py-2 rounded-lg border border-lime-200">
          <span className="text-sm font-medium text-lime-800">Plantando:</span>
          <select
            value={cultivoSeleccionado.id}
            onChange={(e) => {
              const cultivo = catalogoCultivos.find(
                (c) => c.id === e.target.value,
              );
              if (cultivo) setCultivoSeleccionado(cultivo);
            }}
            className="px-2 py-1 rounded text-sm border border-lime-300 text-gray-900 bg-white"
          >
            {catalogoCultivos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          <span className="text-xs text-lime-700 bg-lime-100 px-2 py-1 rounded">
            Espacio: {cultivoSeleccionado.espaciado_recomendado_m}m
          </span>
          <span className="text-lime-800">→</span>
          {zonaSeleccionada ? (
            zonaSeleccionada.tipo === TIPO_ZONA.CULTIVO ? (
              <span className="text-sm text-lime-800 font-medium">
                Haz click DENTRO de &quot;{zonaSeleccionada.nombre}&quot; para
                colocar 1 planta
              </span>
            ) : (
              <span className="text-sm text-red-700 bg-red-100 px-2 py-1 rounded font-medium">
                &quot;{zonaSeleccionada.nombre}&quot; no es cultivo. Haz click
                en una zona VERDE.
              </span>
            )
          ) : (
            <span className="text-sm text-lime-800 font-medium">
              Primero haz click en una zona VERDE para seleccionarla
            </span>
          )}
        </div>
      )}
    </div>
  );
}
