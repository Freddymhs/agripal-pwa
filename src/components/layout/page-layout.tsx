'use client'

import { useState, useRef, useEffect, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useOptionalProjectContext } from '@/contexts/project-context'

interface NavItem {
  href: string
  label: string
  icon?: string
  matchPaths?: string[]
  requiresEstanque?: boolean
}

interface DropdownItem extends NavItem {
  description?: string
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Mapa', icon: '🗺️', matchPaths: ['/'] },
  { href: '/catalogo', label: 'Catálogo', icon: '📚', matchPaths: ['/catalogo'] },
  { href: '/agua', label: 'Agua', icon: '💧', matchPaths: ['/agua'], requiresEstanque: true },
  { href: '/clima', label: 'Clima', icon: '🌤️', matchPaths: ['/clima'] },
  { href: '/suelo', label: 'Suelo', icon: '🌱', matchPaths: ['/suelo'] },
]

const ADVANCED_ITEMS: DropdownItem[] = [
  { 
    href: '/agua/planificador', 
    label: 'Planificador de Agua', 
    icon: '🧪',
    description: 'Simula escenarios antes de invertir'
  },
  { 
    href: '/economia', 
    label: 'Economía', 
    icon: '💰',
    description: 'Seguimiento de costos y ganancias'
  },
  { 
    href: '/economia/proyeccion', 
    label: 'Proyección Financiera', 
    icon: '📊',
    description: 'Proyecta ROI y beneficios'
  },
  { 
    href: '/escenarios', 
    label: 'Escenarios', 
    icon: '🔮',
    description: 'Compara diferentes configuraciones'
  },
  { 
    href: '/plagas', 
    label: 'Plagas', 
    icon: '🐛',
    description: 'Identificación y control'
  },
  { 
    href: '/alertas', 
    label: 'Alertas', 
    icon: '🔔',
    description: 'Historial de notificaciones'
  },
]

interface PageLayoutProps {
  children: ReactNode
  title?: string
  headerColor?: 'green' | 'cyan' | 'blue' | 'amber' | 'emerald'
  headerActions?: ReactNode
}

const HEADER_COLORS = {
  green: 'bg-green-600',
  cyan: 'bg-cyan-600',
  blue: 'bg-blue-600',
  amber: 'bg-amber-600',
  emerald: 'bg-emerald-600',
}

const HEADER_HOVER_COLORS = {
  green: 'hover:bg-green-500',
  cyan: 'hover:bg-cyan-500',
  blue: 'hover:bg-blue-500',
  amber: 'hover:bg-amber-500',
  emerald: 'hover:bg-emerald-500',
}

const HEADER_BORDER_COLORS = {
  green: 'border-green-500',
  cyan: 'border-cyan-500',
  blue: 'border-blue-500',
  amber: 'border-amber-500',
  emerald: 'border-emerald-500',
}

export function PageLayout({ 
  children, 
  title,
  headerColor = 'green',
  headerActions 
}: PageLayoutProps) {
  const pathname = usePathname()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const projectCtx = useOptionalProjectContext()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAdvanced(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isActive = (item: NavItem) => {
    if (item.matchPaths) {
      return item.matchPaths.some(path => 
        path === '/' ? pathname === '/' : pathname.startsWith(path)
      )
    }
    return pathname === item.href
  }

  const isAdvancedActive = ADVANCED_ITEMS.some(item => pathname.startsWith(item.href))

  const bgColor = HEADER_COLORS[headerColor]
  const hoverColor = HEADER_HOVER_COLORS[headerColor]
  const borderColor = HEADER_BORDER_COLORS[headerColor]

  const tieneEstanque = projectCtx?.zonas?.some(z => z.tipo === 'estanque') ?? null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className={`${bgColor} text-white`}>
        <div className="flex items-center justify-between px-4 py-2">
          {/* Logo y navegación */}
          <div className="flex items-center gap-1">
            <Link 
              href="/" 
              className="text-xl font-bold mr-4 hover:opacity-80 transition-opacity"
            >
              AgriPlan
            </Link>

            {/* Tabs principales */}
            <div className="flex items-center">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item)

                const disabled = item.requiresEstanque && tieneEstanque === false && !active

                if (disabled) {
                  return (
                    <span
                      key={item.href}
                      className="px-3 py-2 text-sm font-medium text-white/60 cursor-not-allowed opacity-60 relative group"
                      title="Crea un estanque en el mapa primero"
                    >
                      <span className="flex items-center gap-1.5">
                        {item.icon && <span className="text-xs">{item.icon}</span>}
                        {item.label}
                      </span>
                      <span className="hidden group-hover:block absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50">
                        Crea un estanque primero
                      </span>
                    </span>
                  )
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      px-3 py-2 text-sm font-medium rounded-t-lg transition-all relative
                      ${active 
                        ? 'bg-white text-gray-800 shadow-sm' 
                        : `text-white/80 hover:text-white ${hoverColor}`
                      }
                    `}
                  >
                    <span className="flex items-center gap-1.5">
                      {item.icon && <span className="text-xs">{item.icon}</span>}
                      {item.label}
                    </span>
                  </Link>
                )
              })}

              {/* Dropdown Avanzado */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className={`
                    px-3 py-2 text-sm font-medium rounded-t-lg transition-all flex items-center gap-1.5
                    ${isAdvancedActive 
                      ? 'bg-white text-gray-800 shadow-sm' 
                      : `text-white/80 hover:text-white ${hoverColor}`
                    }
                  `}
                >
                  <span className="text-xs">⚙️</span>
                  Avanzado
                  <svg 
                    className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showAdvanced && (
                  <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    {ADVANCED_ITEMS.map((advItem) => {
                      const advActive = pathname.startsWith(advItem.href)
                      return (
                        <Link
                          key={advItem.href}
                          href={advItem.href}
                          onClick={() => setShowAdvanced(false)}
                          className={`
                            block px-4 py-2.5 hover:bg-gray-50 transition-colors
                            ${advActive ? 'bg-green-50 border-l-4 border-green-500' : ''}
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{advItem.icon}</span>
                            <div className="flex-1">
                              <div className={`text-sm font-medium ${advActive ? 'text-green-700' : 'text-gray-900'}`}>
                                {advItem.label}
                              </div>
                              {advItem.description && (
                                <div className="text-xs text-gray-500">{advItem.description}</div>
                              )}
                            </div>
                            {advActive && (
                              <span className="text-green-500 text-xs">●</span>
                            )}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Título de la página actual */}
            {title && (
              <div className={`ml-4 pl-4 border-l ${borderColor}`}>
                <h1 className="text-lg font-semibold">{title}</h1>
              </div>
            )}
          </div>

          {/* Acciones del header */}
          <div className="flex items-center gap-3">
            {headerActions}
            <Link
              href="/guia"
              className={`
                px-2 py-1 text-xs font-medium rounded transition-colors
                ${pathname === '/guia' 
                  ? 'bg-white text-gray-800' 
                  : `text-white/80 hover:text-white ${hoverColor}`
                }
              `}
            >
              📖 Guía
            </Link>
          </div>
        </div>
      </header>

      {children}
    </div>
  )
}
