"use client";

import type { SueloTerreno } from "@/types";
import { UMBRALES_SUELO } from "@/lib/data/umbrales-suelo";

interface PlanBSueloProps {
  suelo?: SueloTerreno;
}

interface Solucion {
  titulo: string;
  descripcion: string;
  costo?: string;
  efectividad?: string;
}

interface ProblemaConSoluciones {
  problema: string;
  severidad: "alta" | "critica";
  soluciones: Solucion[];
}

export function PlanBSuelo({ suelo }: PlanBSueloProps) {
  const problemas: ProblemaConSoluciones[] = [];

  if (
    suelo?.quimico?.salinidad_dS_m != null &&
    suelo.quimico.salinidad_dS_m > UMBRALES_SUELO.salinidad.max
  ) {
    problemas.push({
      problema: `Salinidad muy alta: ${suelo.quimico.salinidad_dS_m} dS/m (máx ${UMBRALES_SUELO.salinidad.max} dS/m)`,
      severidad: "alta",
      soluciones: [
        {
          titulo: "Lavado de sales",
          descripcion:
            "Aplicar riego abundante para lavar sales hacia capas profundas. Requiere buen drenaje.",
          costo: "Bajo (solo agua)",
          efectividad: "Alta si hay buen drenaje",
        },
        {
          titulo: "Yeso agrícola",
          descripcion:
            "Aplicar yeso (CaSO₄) para desplazar sodio. Dosis: 2-5 ton/ha según análisis.",
          costo: "Medio (~$200,000-500,000 CLP/ha)",
          efectividad: "Alta para suelos sódicos",
        },
        {
          titulo: "Cultivos halófitos",
          descripcion:
            "Cambiar a cultivos tolerantes a sal: quinoa, espárrago, remolacha, algunas forrajeras.",
          costo: "Variable",
          efectividad: "Alternativa viable",
        },
        {
          titulo: "Enmiendas orgánicas",
          descripcion:
            "Agregar compost o guano para mejorar estructura y retención. Mejora a largo plazo.",
          costo: "Medio",
          efectividad: "Moderada, efecto gradual",
        },
      ],
    });
  }

  if (
    suelo?.quimico?.boro_mg_l != null &&
    suelo.quimico.boro_mg_l > UMBRALES_SUELO.boro.max
  ) {
    const esExtremadamenteAlto = suelo.quimico.boro_mg_l > 5;
    problemas.push({
      problema: `Boro ${esExtremadamenteAlto ? "EXTREMADAMENTE" : ""} alto: ${suelo.quimico.boro_mg_l} mg/L (máx ${UMBRALES_SUELO.boro.max} mg/L)`,
      severidad: esExtremadamenteAlto ? "critica" : "alta",
      soluciones: [
        {
          titulo: "Filtración de agua",
          descripcion:
            "Instalar sistema de ósmosis inversa o filtros especializados para agua de riego.",
          costo: "Alto ($2-5M CLP instalación + mantención)",
          efectividad: "Alta si el boro viene del agua",
        },
        {
          titulo: "Fuente de agua alternativa",
          descripcion:
            "Buscar agua de mejor calidad: aljibe de zona sin boro, pozo profundo, o agua de Azapa.",
          costo: "Variable según disponibilidad",
          efectividad: "Alta",
        },
        {
          titulo: "Cultivos tolerantes a boro",
          descripcion:
            "Pocos cultivos toleran alto boro: tuna, higuera, olivo, vid. Descartar frutales sensibles.",
          costo: "Cambio de plan de cultivos",
          efectividad: "Única opción si no hay otra agua",
        },
        ...(esExtremadamenteAlto
          ? [
              {
                titulo: "⚠️ Evaluar viabilidad",
                descripcion:
                  "Con boro >5 mg/L, muy pocos cultivos son viables. Considerar uso no agrícola del terreno.",
                efectividad: "N/A",
              },
            ]
          : []),
      ],
    });
  }

  if (
    suelo?.quimico?.arsenico_mg_l != null &&
    suelo.quimico.arsenico_mg_l > UMBRALES_SUELO.arsenico.max
  ) {
    problemas.push({
      problema: `Arsénico elevado: ${suelo.quimico.arsenico_mg_l} mg/L (máx ${UMBRALES_SUELO.arsenico.max} mg/L)`,
      severidad: "critica",
      soluciones: [
        {
          titulo: "🚨 RIESGO PARA LA SALUD",
          descripcion:
            "El arsénico es tóxico y se acumula en cultivos. NO plantar para consumo humano sin remediación.",
          efectividad: "CRÍTICO",
        },
        {
          titulo: "Análisis profesional",
          descripcion:
            "Consultar con SAG/SEREMI de Salud para evaluar opciones. Puede requerir biorremediación.",
          costo: "Variable",
          efectividad: "Requiere evaluación experta",
        },
        {
          titulo: "Cultivos no alimentarios",
          descripcion:
            "Si se usa el terreno: solo cultivos ornamentales o forestales, NUNCA para consumo.",
          efectividad: "Alternativa limitada",
        },
        {
          titulo: "Proyecto no viable",
          descripcion:
            "Para agricultura alimentaria, el terreno puede NO ser viable. Evaluar uso alternativo.",
          efectividad: "Decisión difícil pero necesaria",
        },
      ],
    });
  }

  if (problemas.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 bg-amber-50 border-b border-amber-200">
        <h3 className="font-bold text-amber-800 flex items-center gap-2">
          <span>🔧</span>
          Plan B: Soluciones para Problemas de Suelo
        </h3>
        <p className="text-sm text-amber-700 mt-1">
          Se detectaron problemas. Aquí hay opciones para remediarlos.
        </p>
      </div>

      <div className="divide-y">
        {problemas.map((item, index) => (
          <div key={index} className="p-4">
            <div
              className={`mb-3 p-2 rounded ${
                item.severidad === "critica"
                  ? "bg-red-100 text-red-800"
                  : "bg-orange-100 text-orange-800"
              }`}
            >
              <span className="font-medium">
                {item.severidad === "critica" ? "🚨" : "⚠️"} {item.problema}
              </span>
            </div>

            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Posibles soluciones:
            </h4>
            <div className="space-y-3">
              {item.soluciones.map((sol, i) => (
                <div key={i} className="bg-gray-50 rounded p-3">
                  <div className="font-medium text-gray-900">{sol.titulo}</div>
                  <p className="text-sm text-gray-600 mt-1">
                    {sol.descripcion}
                  </p>
                  {(sol.costo || sol.efectividad) && (
                    <div className="flex gap-4 mt-2 text-xs">
                      {sol.costo && (
                        <span className="text-gray-500">💰 {sol.costo}</span>
                      )}
                      {sol.efectividad && (
                        <span className="text-gray-500">
                          📊 {sol.efectividad}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-blue-50 border-t border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>Importante:</strong> Consulta con un agrónomo o técnico INDAP
          antes de implementar cualquier solución. Las enmiendas incorrectas
          pueden empeorar el problema.
        </p>
      </div>
    </div>
  );
}
