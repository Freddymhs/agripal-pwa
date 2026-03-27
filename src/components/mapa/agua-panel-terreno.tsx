"use client";

import { useState } from "react";
import type { EntradaAgua, Zona } from "@/types";
import type { ResumenEstanque } from "@/lib/utils/agua";
import {
  ResumenAgua,
  EstanqueCardAgua,
  HistorialAgua,
} from "@/components/agua";

interface AguaPanelTerrenoProps {
  estanques: Zona[];
  aguaTotalActual: number;
  aguaTotalDisponible: number;
  consumoSemanal: number;
  diasCritico: number;
  diasPorEstanque: ResumenEstanque[];
  diasHastaRecarga?: number | null;
  entradas: EntradaAgua[];
  onRegistrarAgua: () => void;
  onConfigurarRecarga: (estanqueId: string) => void;
}

export function AguaPanelTerreno({
  estanques,
  aguaTotalActual,
  aguaTotalDisponible,
  consumoSemanal,
  diasCritico,
  diasPorEstanque,
  diasHastaRecarga,
  entradas,
  onRegistrarAgua,
  onConfigurarRecarga,
}: AguaPanelTerrenoProps) {
  const [showHistorial, setShowHistorial] = useState(false);

  if (estanques.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
        <p className="text-sm text-yellow-800">
          No hay estanques configurados. Crea una zona de tipo
          &quot;estanque&quot; en el mapa.
        </p>
      </div>
    );
  }

  const esUnico = estanques.length === 1;

  return (
    <>
      <div className="space-y-3">
        {!esUnico && (
          <ResumenAgua
            aguaActual={aguaTotalActual}
            aguaMaxima={aguaTotalDisponible}
            consumoSemanal={consumoSemanal}
            onRegistrarAgua={onRegistrarAgua}
            deshabilitarRegistro={estanques.length === 0}
            diasHastaRecarga={diasHastaRecarga}
            diasRestantesOverride={diasCritico}
          />
        )}

        {estanques.map((est) => (
          <EstanqueCardAgua
            key={est.id}
            estanque={est}
            resumen={diasPorEstanque.find((r) => r.estanqueId === est.id)}
            onConfigurarRecarga={() => onConfigurarRecarga(est.id)}
            onRegistrarAgua={esUnico ? onRegistrarAgua : undefined}
            entradasRecientes={entradas}
            onVerHistorial={
              entradas.length > 0 ? () => setShowHistorial(true) : undefined
            }
          />
        ))}
      </div>

      {/* Historial modal */}
      {showHistorial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="border-b px-4 py-3 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-gray-900">Historial de Entradas</h3>
              <button
                onClick={() => setShowHistorial(false)}
                className="text-gray-400 hover:text-gray-600"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto p-4">
              <HistorialAgua entradas={entradas} estanques={estanques} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
