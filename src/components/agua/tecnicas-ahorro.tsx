"use client";

import type { TecnicasAhorroAgua } from "@/types";
import type { TecnicaMejora } from "@/lib/data/tecnicas-mejora";

interface TecnicasAhorroProps {
  tecnicas?: TecnicasAhorroAgua;
  onChange?: (tecnicas: TecnicasAhorroAgua) => void;
  readOnly?: boolean;
  tecnicasCatalogo?: TecnicaMejora[];
}

/** Mapeo entre id de Supabase y key del toggle en TecnicasAhorroAgua */
const ID_A_KEY: Record<string, keyof TecnicasAhorroAgua> = {
  "riego-deficitario-controlado": "riego_deficitario_controlado",
  hidrogel: "hidrogel",
  "mulch-organico": "mulch",
  "sensores-humedad": "sensores_humedad",
};

const KEYS_TECNICAS = Object.values(ID_A_KEY);

export function TecnicasAhorro({
  tecnicas,
  onChange,
  readOnly = false,
  tecnicasCatalogo = [],
}: TecnicasAhorroProps) {
  const handleToggle = (key: keyof TecnicasAhorroAgua) => {
    if (onChange) {
      onChange({ ...tecnicas, [key]: !tecnicas?.[key] });
    }
  };

  const items = KEYS_TECNICAS.map((key) => {
    const entry = Object.entries(ID_A_KEY).find(([, v]) => v === key);
    const supabaseId = entry?.[0];
    const catalogoItem = supabaseId
      ? tecnicasCatalogo.find((t) => t.id === supabaseId)
      : undefined;

    return {
      key,
      nombre: catalogoItem?.nombre ?? key,
      ahorro: catalogoItem?.ahorro_agua ?? null,
      descripcion: catalogoItem?.efecto ?? "",
    };
  });

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Técnicas de Ahorro de Agua</h3>

      <div className="space-y-3">
        {items.map(({ key, nombre, ahorro, descripcion }) => (
          <div
            key={key}
            className={`p-3 rounded-lg border ${
              tecnicas?.[key]
                ? "bg-green-50 border-green-200"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="flex items-start gap-3">
              {!readOnly && (
                <input
                  type="checkbox"
                  checked={tecnicas?.[key] || false}
                  onChange={() => handleToggle(key)}
                  className="mt-1 rounded"
                />
              )}
              {readOnly && (
                <span
                  className={`w-5 h-5 flex items-center justify-center rounded text-xs ${
                    tecnicas?.[key]
                      ? "bg-green-500 text-white"
                      : "bg-gray-300 text-white"
                  }`}
                >
                  {tecnicas?.[key] ? "✓" : "×"}
                </span>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{nombre}</span>
                  {ahorro && (
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                      Ahorro: {ahorro}
                    </span>
                  )}
                </div>
                {descripcion && (
                  <p className="text-sm text-gray-600 mt-1">{descripcion}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
