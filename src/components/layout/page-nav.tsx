"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";

interface NavItem {
  href: string;
  label: string;
  icon?: string;
  matchPaths?: string[];
  requiresEstanque?: boolean;
}

interface DropdownItem extends NavItem {
  description?: string;
}

interface DropdownGroup {
  label: string;
  items: DropdownItem[];
}

// ─── Estructura Configurar / Operar / Analizar ────────────────────────────────

const NAV_GROUPS: DropdownGroup[] = [
  {
    label: "Configurar",
    items: [
      {
        href: ROUTES.TERRENOS_SUELO,
        label: "Análisis de Suelo",
        icon: "🌱",
        description: "pH, salinidad, materia orgánica",
      },
      {
        href: ROUTES.DATOS_CLIMA,
        label: "Clima de la región",
        icon: "🌤️",
        description: "ET0 histórica y temporadas",
      },
      {
        href: ROUTES.DATOS_CATALOGO,
        label: "Catálogo de Cultivos",
        icon: "📚",
        description: "Fichas técnicas y cultivos",
      },
    ],
  },
  {
    label: "Operar",
    items: [
      {
        href: ROUTES.HOME,
        label: "Mapa",
        icon: "🗺️",
        description: "Zonas, estanques y plantas",
        matchPaths: [ROUTES.HOME],
      },
      {
        href: ROUTES.AGUA,
        label: "Control de Riego",
        icon: "💧",
        description: "Nivel de estanques y consumo diario",
        matchPaths: [ROUTES.AGUA],
        requiresEstanque: true,
      },
      {
        href: ROUTES.COSECHAS,
        label: "Cosechas",
        icon: "🌾",
        description: "Registra producción real por zona",
      },
      {
        href: ROUTES.DATOS_INSUMOS,
        label: "Insumos",
        icon: "📦",
        description: "Compatibilidad química y stock",
      },
      {
        href: ROUTES.DATOS_PLAGAS,
        label: "Riesgo de Plagas",
        icon: "🐛",
        description: "Predicción por cultivo y temporada",
      },
    ],
  },
  {
    label: "Analizar",
    items: [
      {
        href: ROUTES.ECONOMIA,
        label: "Economía",
        icon: "💰",
        description: "Ingresos, inversión y ROI",
        matchPaths: [ROUTES.ECONOMIA],
      },
      {
        href: ROUTES.ECONOMIA_AVANZADO,
        label: "Economía Avanzada",
        icon: "📊",
        description: "Costo/kg, payback, margen de contribución",
      },
      {
        href: ROUTES.ECONOMIA_ESCENARIOS,
        label: "Comparar Cultivos",
        icon: "🔮",
        description: "¿Tuna, olivo o higuera? Compara ROI",
      },
      {
        href: ROUTES.ALERTAS,
        label: "Alertas",
        icon: "🔔",
        description: "Escasez de agua, plagas y cosechas",
        matchPaths: [ROUTES.ALERTAS],
      },
      {
        href: ROUTES.AGUA_PLANIFICADOR,
        label: "Planificador 12 meses",
        icon: "📅",
        description: "¿Alcanzará el agua todo el año?",
      },
      {
        href: ROUTES.REPORTES,
        label: "Reportes PDF",
        icon: "📋",
        description: "Informes para banco, INDAP o asesor",
      },
      {
        href: ROUTES.CONFIGURACION,
        label: "Configuración",
        icon: "⚙️",
        description: "Sync con la nube y preferencias",
      },
    ],
  },
];

// Flat list for active-path detection across all groups
const ALL_NAV_ITEMS: DropdownItem[] = NAV_GROUPS.flatMap((g) => g.items);

// Keep exporting NAV_ITEMS as the flat list for consumers that used it
export const NAV_ITEMS: NavItem[] = ALL_NAV_ITEMS;

interface PageNavProps {
  hoverColor: string;
  tieneEstanque: boolean | null;
}

export function PageNav({ hoverColor, tieneEstanque }: PageNavProps) {
  const pathname = usePathname();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenGroup(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isItemActive = (item: DropdownItem) => {
    if (item.matchPaths)
      return item.matchPaths.some((path) =>
        path === "/" ? pathname === "/" : pathname.startsWith(path),
      );
    return pathname === item.href;
  };

  const isGroupActive = (group: DropdownGroup) =>
    group.items.some((item) => isItemActive(item));

  const toggleGroup = (label: string) =>
    setOpenGroup((prev) => (prev === label ? null : label));

  const GROUP_ICONS: Record<string, string> = {
    Configurar: "🔧",
    Operar: "🌿",
    Analizar: "📊",
  };

  return (
    <div className="flex items-center" ref={navRef}>
      {NAV_GROUPS.map((group) => {
        const active = isGroupActive(group);
        const isOpen = openGroup === group.label;

        return (
          <div key={group.label} className="relative">
            <button
              onClick={() => toggleGroup(group.label)}
              className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-all flex items-center gap-1.5 ${
                active || isOpen
                  ? "bg-white text-gray-800 shadow-sm"
                  : `text-white/80 hover:text-white ${hoverColor}`
              }`}
            >
              <span className="text-xs">{GROUP_ICONS[group.label]}</span>
              {group.label}
              <svg
                className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isOpen && (
              <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                <div className="px-4 pt-2.5 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  {group.label}
                </div>
                {group.items.map((item) => {
                  const itemActive = isItemActive(item);
                  const disabled =
                    item.requiresEstanque &&
                    tieneEstanque === false &&
                    !itemActive;

                  if (disabled) {
                    return (
                      <div
                        key={item.href}
                        className="flex items-center gap-3 px-4 py-2 opacity-50 cursor-not-allowed"
                        title="Crea un estanque en el mapa primero"
                      >
                        <span className="text-base w-5 text-center shrink-0">
                          {item.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-400">
                            {item.label}
                          </div>
                          <div className="text-xs text-gray-300 truncate">
                            Crea un estanque primero
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpenGroup(null)}
                      className={`flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors ${
                        itemActive
                          ? "bg-green-50 border-l-2 border-green-500 pl-[14px]"
                          : ""
                      }`}
                    >
                      <span className="text-base w-5 text-center shrink-0">
                        {item.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-sm font-medium ${itemActive ? "text-green-700" : "text-gray-900"}`}
                        >
                          {item.label}
                        </div>
                        {item.description && (
                          <div className="text-xs text-gray-400 truncate">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
