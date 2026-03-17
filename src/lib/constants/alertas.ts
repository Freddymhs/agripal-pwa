import type { SeveridadAlerta } from "@/types";

export const SEVERIDAD_CONFIG: Record<
  SeveridadAlerta,
  {
    bg: string;
    leftBorder: string;
    icon: string;
    color: string;
  }
> = {
  critical: {
    bg: "bg-red-50",
    leftBorder: "border-l-4 border-l-red-500",
    icon: "🔴",
    color: "text-red-800",
  },
  warning: {
    bg: "bg-amber-50",
    leftBorder: "border-l-4 border-l-amber-500",
    icon: "⚠️",
    color: "text-amber-800",
  },
  info: {
    bg: "bg-blue-50",
    leftBorder: "border-l-4 border-l-blue-400",
    icon: "ℹ️",
    color: "text-blue-800",
  },
};
