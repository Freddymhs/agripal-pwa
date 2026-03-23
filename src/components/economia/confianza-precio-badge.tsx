import type { ResumenPrecioHistorico } from "@/types";

interface ConfianzaPrecioBadgeProps {
  resumen: ResumenPrecioHistorico | undefined;
  nombreOdepa: string | null | undefined;
}

export function ConfianzaPrecioBadge({
  resumen,
  nombreOdepa,
}: ConfianzaPrecioBadgeProps) {
  if (!nombreOdepa) {
    return (
      <span className="text-[9px] bg-gray-100 text-gray-400 px-1 py-0.5 rounded">
        Sin ODEPA
      </span>
    );
  }
  if (!resumen || resumen.meses_con_datos === 0) {
    return (
      <span className="text-[9px] bg-gray-100 text-gray-400 px-1 py-0.5 rounded">
        Sin historico
      </span>
    );
  }
  if (resumen.meses_con_datos >= 6) {
    return (
      <span className="text-[9px] bg-green-100 text-green-700 px-1 py-0.5 rounded">
        ODEPA {resumen.meses_con_datos}m
      </span>
    );
  }
  return (
    <span className="text-[9px] bg-yellow-100 text-yellow-700 px-1 py-0.5 rounded">
      ODEPA {resumen.meses_con_datos}m
    </span>
  );
}
