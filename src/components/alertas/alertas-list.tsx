"use client";

import type { Alerta, UUID } from "@/types";
import { SEVERIDAD_CONFIG } from "@/lib/constants/alertas";

interface AlertasListProps {
  alertas: Alerta[];
  onResolver: (id: UUID, como: string) => void;
  onIgnorar: (id: UUID) => void;
}

export function AlertasList({
  alertas,
  onResolver,
  onIgnorar,
}: AlertasListProps) {
  if (alertas.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        ✅ No hay alertas activas
      </div>
    );
  }

  const ordenadas = [...alertas].sort((a, b) => {
    const orden = { critical: 0, warning: 1, info: 2 };
    return orden[a.severidad] - orden[b.severidad];
  });

  return (
    <div className="space-y-3">
      {ordenadas.map((alerta) => (
        <AlertaCard
          key={alerta.id}
          alerta={alerta}
          onResolver={onResolver}
          onIgnorar={onIgnorar}
        />
      ))}
    </div>
  );
}

function AlertaCard({
  alerta,
  onResolver,
  onIgnorar,
}: {
  alerta: Alerta;
  onResolver: (id: UUID, como: string) => void;
  onIgnorar: (id: UUID) => void;
}) {
  const config = SEVERIDAD_CONFIG[alerta.severidad];

  return (
    <div
      className={`${config.bg} ${config.leftBorder} rounded-lg p-4 shadow-sm`}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg leading-tight mt-0.5">{config.icon}</span>
        <div className="flex-1">
          <h4 className={`font-semibold text-base ${config.color}`}>
            {alerta.titulo}
          </h4>
          <p className="text-sm text-gray-600 mt-1">{alerta.descripcion}</p>
          {alerta.sugerencia && (
            <p className="text-xs text-gray-400 mt-1 italic">
              💡 {alerta.sugerencia}
            </p>
          )}

          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={() => onResolver(alerta.id, "Resuelto manualmente")}
              className="text-sm text-green-600 border border-green-300 rounded px-3 py-1.5 hover:bg-green-50 transition-colors"
            >
              Marcar resuelta
            </button>
            <button
              onClick={() => onIgnorar(alerta.id)}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Ignorar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
