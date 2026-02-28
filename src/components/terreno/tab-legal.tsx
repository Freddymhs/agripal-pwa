"use client";

import type { LegalTerreno } from "@/types";
import {
  SeccionDerechosAgua,
  SeccionPermisos,
  SeccionSeguros,
} from "./tab-legal-secciones";

interface TabLegalProps {
  value: LegalTerreno;
  onChange: (v: LegalTerreno) => void;
}

const TIPOS_PROPIEDAD = [
  { value: "propio", label: "Propio" },
  { value: "arriendo", label: "Arriendo" },
  { value: "comodato", label: "Comodato" },
  { value: "sucesion", label: "Sucesion" },
] as const;

export function TabLegal({ value, onChange }: TabLegalProps) {
  return (
    <div className="space-y-6">
      <SeccionPropiedad value={value} onChange={onChange} />
      <SeccionRegistroAgricola value={value} onChange={onChange} />
      <SeccionDerechosAgua value={value} onChange={onChange} />
      <SeccionPermisos value={value} onChange={onChange} />
      <SeccionSeguros value={value} onChange={onChange} />
    </div>
  );
}

function SeccionPropiedad({ value, onChange }: TabLegalProps) {
  return (
    <div>
      <h3 className="font-medium text-gray-900 mb-3">Propiedad</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Propiedad
          </label>
          <select
            value={value.tipo_propiedad || ""}
            onChange={(e) =>
              onChange({
                ...value,
                tipo_propiedad: e.target
                  .value as LegalTerreno["tipo_propiedad"],
              })
            }
            className="w-full px-3 py-2 border rounded text-gray-900"
          >
            <option value="">Seleccionar...</option>
            {TIPOS_PROPIEDAD.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rol SII
          </label>
          <input
            type="text"
            value={value.rol_sii || ""}
            onChange={(e) => onChange({ ...value, rol_sii: e.target.value })}
            placeholder="1234-5678"
            className="w-full px-3 py-2 border rounded text-gray-900"
          />
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.titulo_saneado || false}
            onChange={(e) =>
              onChange({ ...value, titulo_saneado: e.target.checked })
            }
            className="rounded"
          />
          <span className="text-sm text-gray-700">Titulo saneado</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.contribuciones_al_dia || false}
            onChange={(e) =>
              onChange({ ...value, contribuciones_al_dia: e.target.checked })
            }
            className="rounded"
          />
          <span className="text-sm text-gray-700">Contribuciones al dia</span>
        </label>
      </div>
    </div>
  );
}

function SeccionRegistroAgricola({ value, onChange }: TabLegalProps) {
  return (
    <div>
      <h3 className="font-medium text-gray-900 mb-3">Registro Agricola</h3>
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded mb-3">
        <p className="text-sm text-yellow-800">
          <strong>Inscripcion SAG:</strong> OBLIGATORIA para vender productos
          agricolas
        </p>
      </div>
      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.registro_agricola?.inscripcion_sag || false}
            onChange={(e) =>
              onChange({
                ...value,
                registro_agricola: {
                  ...value.registro_agricola,
                  inscripcion_sag: e.target.checked,
                },
              })
            }
            className="rounded"
          />
          <span className="text-sm text-gray-700">Inscripcion SAG</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.registro_agricola?.registro_indap || false}
            onChange={(e) =>
              onChange({
                ...value,
                registro_agricola: {
                  ...value.registro_agricola,
                  registro_indap: e.target.checked,
                },
              })
            }
            className="rounded"
          />
          <span className="text-sm text-gray-700">
            Registro INDAP (para subsidios)
          </span>
        </label>
        <div className="mt-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            RUT Agricola
          </label>
          <input
            type="text"
            value={value.registro_agricola?.rut_agricola || ""}
            onChange={(e) =>
              onChange({
                ...value,
                registro_agricola: {
                  ...value.registro_agricola,
                  rut_agricola: e.target.value,
                },
              })
            }
            placeholder="12.345.678-9"
            className="w-full px-3 py-2 border rounded text-gray-900"
          />
        </div>
      </div>
    </div>
  );
}
