"use client";

import type { TecnicaMejora } from "@/lib/data/tecnicas-mejora";

interface TecnicasAhorroProps {
  tecnicasCatalogo?: TecnicaMejora[];
}

const CATEGORIA_COLORES: Record<string, string> = {
  bioestimulante: "bg-emerald-100 text-emerald-700",
  biológico: "bg-lime-100 text-lime-700",
  biologico: "bg-lime-100 text-lime-700",
  retenedor: "bg-blue-100 text-blue-700",
  cobertura: "bg-amber-100 text-amber-700",
  riego: "bg-cyan-100 text-cyan-700",
  tecnología: "bg-purple-100 text-purple-700",
  tecnologia: "bg-purple-100 text-purple-700",
};

const CATEGORIA_FALLBACK = "bg-gray-100 text-gray-700";

export function TecnicasAhorro({ tecnicasCatalogo = [] }: TecnicasAhorroProps) {
  if (tecnicasCatalogo.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        No hay técnicas de ahorro cargadas en el catálogo.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium text-gray-900">
          Técnicas de Ahorro de Agua
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Técnicas que puedes aplicar para optimizar el uso de agua. Si aplicas
          alguna, ajusta tu configuración de riego en cada zona.
        </p>
      </div>

      <div className="space-y-3">
        {tecnicasCatalogo.map((tecnica) => (
          <TecnicaCard key={tecnica.id} tecnica={tecnica} />
        ))}
      </div>
    </div>
  );
}

function TecnicaCard({ tecnica }: { tecnica: TecnicaMejora }) {
  const colorCategoria =
    CATEGORIA_COLORES[tecnica.categoria] ?? CATEGORIA_FALLBACK;

  return (
    <div className="p-3 rounded-lg border bg-white">
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="font-medium text-gray-900">{tecnica.nombre}</span>
        <span
          className={`text-xs px-2 py-0.5 rounded shrink-0 ${colorCategoria}`}
        >
          {tecnica.categoria}
        </span>
      </div>

      <p className="text-sm text-gray-600">{tecnica.efecto}</p>

      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
        {tecnica.ahorro_agua && (
          <span className="font-medium text-blue-700">
            Ahorro: {tecnica.ahorro_agua}
          </span>
        )}
        {tecnica.dosis && <span>Dosis: {tecnica.dosis}</span>}
        <span>Frecuencia: {tecnica.frecuencia}</span>
        <span>
          Costo: ${tecnica.costo_aplicacion_clp.toLocaleString("es-CL")} CLP
        </span>
      </div>

      {tecnica.evidencia && (
        <p className="text-xs text-gray-400 mt-1.5 italic">
          {tecnica.evidencia}
        </p>
      )}
    </div>
  );
}
