import type { SeveridadAlerta } from "@/types";

export const SEVERIDAD_CONFIG: Record<
  SeveridadAlerta,
  {
    bg: string;
    border: string;
    icon: string;
    color: string;
  }
> = {
  critical: {
    bg: "bg-red-50",
    border: "border-red-200",
    icon: "🚨",
    color: "text-red-800",
  },
  warning: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    icon: "⚠️",
    color: "text-yellow-800",
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: "ℹ️",
    color: "text-blue-800",
  },
};
