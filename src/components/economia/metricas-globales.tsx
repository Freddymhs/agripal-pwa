import { formatCLP } from "@/lib/utils";
import { MARGEN_BUENO_PCT, MARGEN_BAJO_PCT } from "@/lib/constants/umbrales";

interface MetricasGlobalesProps {
  avgCostoKg: number;
  totalKg: number;
  avgMargen: number;
  mejorRecuperacion: number | null;
}

export function MetricasGlobales({
  avgCostoKg,
  totalKg,
  avgMargen,
  mejorRecuperacion,
}: MetricasGlobalesProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="bg-white rounded-lg shadow p-4 text-center">
        <div className="text-3xl font-bold text-blue-700">
          {formatCLP(avgCostoKg)}
        </div>
        <div className="text-xs text-blue-600 mt-1">Costo Promedio / kg</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4 text-center">
        <div className="text-3xl font-bold text-purple-700">
          {Math.round(totalKg).toLocaleString("es-CL")} kg
        </div>
        <div className="text-xs text-purple-600 mt-1">
          Produccion Anual (Ano 3)
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-4 text-center">
        <div
          className={`text-3xl font-bold ${
            avgMargen > MARGEN_BUENO_PCT
              ? "text-green-700"
              : avgMargen > MARGEN_BAJO_PCT
                ? "text-yellow-700"
                : "text-red-700"
          }`}
        >
          {Math.round(avgMargen)}%
        </div>
        <div className="text-xs text-gray-600 mt-1">Margen Contribucion</div>
        <div
          className={`text-xs mt-1 px-2 py-0.5 rounded-full inline-block ${
            avgMargen > MARGEN_BUENO_PCT
              ? "bg-green-100 text-green-800"
              : avgMargen > MARGEN_BAJO_PCT
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
          }`}
        >
          {avgMargen > MARGEN_BUENO_PCT
            ? "Saludable"
            : avgMargen > MARGEN_BAJO_PCT
              ? "Ajustado"
              : "Riesgo"}
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-4 text-center">
        <div className="text-3xl font-bold text-amber-700">
          {mejorRecuperacion != null ? `${mejorRecuperacion}m` : "-"}
        </div>
        <div className="text-xs text-amber-600 mt-1">
          Recuperacion Inversion
        </div>
      </div>
    </div>
  );
}
