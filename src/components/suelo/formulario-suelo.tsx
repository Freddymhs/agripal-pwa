"use client";

import { useState, useEffect, useRef } from "react";
import type { SueloTerreno, TexturaSuelo, DrenajeSuelo } from "@/types";
import { UMBRALES_SUELO } from "@/lib/data/umbrales-suelo";
import {
  getIndicador,
  safeParseFloat,
  safeParseInt,
  coloresIndicador,
  deepEqual,
} from "./suelo-form-utils";
import { AnalisisQuimico } from "./analisis-quimico";

interface FormularioSueloProps {
  suelo?: SueloTerreno;
  onChange: (suelo: SueloTerreno) => void;
}

const TEXTURAS: { value: TexturaSuelo; label: string }[] = [
  { value: "arenosa", label: "Arenosa" },
  { value: "franco-arenosa", label: "Franco-arenosa" },
  { value: "franco", label: "Franco" },
  { value: "franco-arcillosa", label: "Franco-arcillosa" },
  { value: "arcillosa", label: "Arcillosa" },
];

const DRENAJES: { value: DrenajeSuelo; label: string }[] = [
  { value: "rapido", label: "Rapido" },
  { value: "bueno", label: "Bueno" },
  { value: "moderado", label: "Moderado" },
  { value: "lento", label: "Lento" },
];

export function FormularioSuelo({ suelo, onChange }: FormularioSueloProps) {
  const [fisico, setFisico] = useState(suelo?.fisico || {});
  const [quimico, setQuimico] = useState(suelo?.quimico || {});
  const isInitialMount = useRef(true);
  const lastSuelo = useRef(suelo);

  useEffect(() => {
    if (suelo && !deepEqual(suelo, lastSuelo.current)) {
      // Solo disparar cuando suelo (prop externa) cambia; fisico/quimico locales
      // no son deps porque su cambio ya está guardado en lastSuelo.current
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincronización de prop externa → estado local del formulario
      if (suelo.fisico) setFisico(suelo.fisico);
      if (suelo.quimico) setQuimico(suelo.quimico);
      lastSuelo.current = suelo;
    }
  }, [suelo]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const newSuelo = { fisico, quimico };
    if (!deepEqual(newSuelo, lastSuelo.current)) {
      lastSuelo.current = newSuelo;
      onChange(newSuelo);
    }
  }, [fisico, quimico, onChange]);

  const { ph: umbralPh, profundidad_frutales: umbralProfundidad } =
    UMBRALES_SUELO;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Analisis Fisico</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              pH
            </label>
            <input
              type="number"
              step="0.1"
              min={0}
              max={14}
              value={fisico.ph ?? ""}
              onChange={(e) => {
                setFisico({
                  ...fisico,
                  ph: safeParseFloat(e.target.value.trim()),
                });
              }}
              placeholder="6.5 - 7.5"
              className={`w-full px-3 py-2 border rounded text-gray-900 ${
                coloresIndicador[getIndicador(fisico.ph, umbralPh)]
              }`}
            />
            <p className="text-xs text-gray-500 mt-1">
              Optimo: {umbralPh.min} - {umbralPh.max}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Materia Organica (%)
            </label>
            <input
              type="number"
              step="0.1"
              min={0}
              max={100}
              value={fisico.materia_organica_pct ?? ""}
              onChange={(e) => {
                setFisico({
                  ...fisico,
                  materia_organica_pct: safeParseFloat(e.target.value.trim()),
                });
              }}
              placeholder="2 - 5%"
              className="w-full px-3 py-2 border rounded text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Textura
            </label>
            <select
              value={fisico.textura ?? ""}
              onChange={(e) =>
                setFisico({
                  ...fisico,
                  textura:
                    e.target.value === ""
                      ? undefined
                      : (e.target.value as TexturaSuelo),
                })
              }
              className="w-full px-3 py-2 border rounded text-gray-900"
            >
              <option value="">Seleccionar...</option>
              {TEXTURAS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Drenaje
            </label>
            <select
              value={fisico.drenaje ?? ""}
              onChange={(e) =>
                setFisico({
                  ...fisico,
                  drenaje:
                    e.target.value === ""
                      ? undefined
                      : (e.target.value as DrenajeSuelo),
                })
              }
              className="w-full px-3 py-2 border rounded text-gray-900"
            >
              <option value="">Seleccionar...</option>
              {DRENAJES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Profundidad efectiva (cm)
            </label>
            <input
              type="number"
              min={0}
              max={500}
              value={fisico.profundidad_efectiva_cm ?? ""}
              onChange={(e) => {
                setFisico({
                  ...fisico,
                  profundidad_efectiva_cm: safeParseInt(e.target.value.trim()),
                });
              }}
              placeholder="Min. 60cm para frutales"
              className={`w-full px-3 py-2 border rounded text-gray-900 ${
                coloresIndicador[
                  getIndicador(fisico.profundidad_efectiva_cm, {
                    min: umbralProfundidad.min,
                  })
                ]
              }`}
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimo {umbralProfundidad.min}cm para frutales
            </p>
          </div>
        </div>
      </div>

      <AnalisisQuimico quimico={quimico} onChangeQuimico={setQuimico} />
    </div>
  );
}
