"use client";

import { useState, useMemo } from "react";
import { calcularROI } from "@/lib/utils/roi";
import type { CatalogoCultivo, Zona, SueloTerreno } from "@/types";
import { formatCLP } from "@/lib/utils";
import { calcularDensidadPlantas } from "@/lib/utils/helpers-cultivo";

interface ComparadorProps {
  zona: Zona;
  catalogoCultivos: CatalogoCultivo[];
  costoAguaM3: number;
  suelo?: SueloTerreno | null;
}

export function Comparador({
  zona,
  catalogoCultivos,
  costoAguaM3,
  suelo,
}: ComparadorProps) {
  const [cultivoA, setCultivoA] = useState<string>(
    catalogoCultivos[0]?.id || "",
  );
  const [cultivoB, setCultivoB] = useState<string>(
    catalogoCultivos[1]?.id || "",
  );

  const roiA = useMemo(() => {
    const c = catalogoCultivos.find((x) => x.id === cultivoA);
    if (!c) return null;
    const { numPlantas } = calcularDensidadPlantas(
      c.espaciado_recomendado_m,
      zona.area_m2,
    );
    return calcularROI(c, zona, numPlantas, costoAguaM3, undefined, suelo);
  }, [cultivoA, zona, catalogoCultivos, costoAguaM3, suelo]);

  const roiB = useMemo(() => {
    const c = catalogoCultivos.find((x) => x.id === cultivoB);
    if (!c) return null;
    const { numPlantas } = calcularDensidadPlantas(
      c.espaciado_recomendado_m,
      zona.area_m2,
    );
    return calcularROI(c, zona, numPlantas, costoAguaM3, undefined, suelo);
  }, [cultivoB, zona, catalogoCultivos, costoAguaM3, suelo]);

  if (catalogoCultivos.length < 2) return null;

  return (
    <div className="space-y-3">
      <h5 className="text-xs font-medium text-gray-700">
        Comparar cultivos en {zona.nombre}
      </h5>

      <div className="grid grid-cols-2 gap-2">
        <select
          value={cultivoA}
          onChange={(e) => setCultivoA(e.target.value)}
          className="text-xs border rounded p-1.5 text-gray-900"
        >
          {catalogoCultivos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <select
          value={cultivoB}
          onChange={(e) => setCultivoB(e.target.value)}
          className="text-xs border rounded p-1.5 text-gray-900"
        >
          {catalogoCultivos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      {roiA && roiB && (
        <div className="text-xs">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1 text-gray-500 font-normal"></th>
                <th className="text-right py-1 text-gray-700 font-medium">
                  {roiA.cultivo_nombre}
                </th>
                <th className="text-right py-1 text-gray-700 font-medium">
                  {roiB.cultivo_nombre}
                </th>
              </tr>
            </thead>
            <tbody className="text-gray-600">
              <CompRow
                label="Plantas"
                a={roiA.num_plantas.toString()}
                b={roiB.num_plantas.toString()}
              />
              <CompRow
                label="Inversión"
                a={formatCLP(roiA.inversion_total)}
                b={formatCLP(roiB.inversion_total)}
              />
              <CompRow
                label="Agua/año"
                a={formatCLP(roiA.costo_agua_anual)}
                b={formatCLP(roiB.costo_agua_anual)}
              />
              <CompRow
                label="Ingreso Año 4"
                a={formatCLP(roiA.ingreso_año4)}
                b={formatCLP(roiB.ingreso_año4)}
                highlight
              />
              <CompRow
                label="ROI 4 años"
                a={`${roiA.roi_4_años_pct}%`}
                b={`${roiB.roi_4_años_pct}%`}
                highlight
                colorA={roiA.roi_4_años_pct > 0}
                colorB={roiB.roi_4_años_pct > 0}
              />
              <CompRow
                label="Equilibrio"
                a={
                  roiA.punto_equilibrio_meses
                    ? `${roiA.punto_equilibrio_meses}m`
                    : "N/A"
                }
                b={
                  roiB.punto_equilibrio_meses
                    ? `${roiB.punto_equilibrio_meses}m`
                    : "N/A"
                }
              />
            </tbody>
          </table>

          {roiA.roi_4_años_pct !== roiB.roi_4_años_pct && (
            <div className="mt-2 bg-green-50 p-2 rounded text-green-800">
              {roiA.roi_4_años_pct > roiB.roi_4_años_pct
                ? `${roiA.cultivo_nombre} tiene mejor ROI (+${roiA.roi_4_años_pct - roiB.roi_4_años_pct}%)`
                : `${roiB.cultivo_nombre} tiene mejor ROI (+${roiB.roi_4_años_pct - roiA.roi_4_años_pct}%)`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CompRow({
  label,
  a,
  b,
  highlight,
  colorA,
  colorB,
}: {
  label: string;
  a: string;
  b: string;
  highlight?: boolean;
  colorA?: boolean;
  colorB?: boolean;
}) {
  return (
    <tr className={highlight ? "font-medium" : ""}>
      <td className="py-0.5 text-gray-500">{label}</td>
      <td
        className={`text-right py-0.5 ${colorA === true ? "text-green-700" : colorA === false ? "text-red-700" : ""}`}
      >
        {a}
      </td>
      <td
        className={`text-right py-0.5 ${colorB === true ? "text-green-700" : colorB === false ? "text-red-700" : ""}`}
      >
        {b}
      </td>
    </tr>
  );
}
