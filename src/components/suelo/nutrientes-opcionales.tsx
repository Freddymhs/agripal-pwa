"use client";

import type { SueloTerreno } from "@/types";
import { safeParseFloat } from "./suelo-form-utils";

interface NutrientesOpcionalesProps {
  quimico: NonNullable<SueloTerreno["quimico"]>;
  onChangeQuimico: (q: NonNullable<SueloTerreno["quimico"]>) => void;
}

export function NutrientesOpcionales({
  quimico,
  onChangeQuimico,
}: NutrientesOpcionalesProps) {
  const fields: Array<{
    key: keyof typeof quimico;
    label: string;
    max: number;
  }> = [
    { key: "nitrogeno_ppm", label: "N (ppm)", max: 500 },
    { key: "fosforo_ppm", label: "P (ppm)", max: 500 },
    { key: "potasio_ppm", label: "K (ppm)", max: 5000 },
    { key: "calcio_ppm", label: "Ca (ppm)", max: 10000 },
    { key: "magnesio_ppm", label: "Mg (ppm)", max: 5000 },
  ];

  return (
    <>
      <h4 className="font-medium text-gray-700 mt-4 mb-2 text-sm">
        Nutrientes (opcional)
      </h4>
      <div className="grid grid-cols-5 gap-2">
        {fields.map(({ key, label, max }) => (
          <div key={key}>
            <label className="block text-xs text-gray-600 mb-1">{label}</label>
            <input
              type="number"
              min={0}
              max={max}
              value={(quimico[key] as number | undefined) ?? ""}
              onChange={(e) =>
                onChangeQuimico({
                  ...quimico,
                  [key]: safeParseFloat(e.target.value.trim()),
                })
              }
              className="w-full px-2 py-1 border rounded text-sm text-gray-900"
            />
          </div>
        ))}
      </div>
    </>
  );
}
