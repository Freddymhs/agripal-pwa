'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

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

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Mapa', icon: '🗺️', matchPaths: ['/'] },
  { href: '/catalogo', label: 'Catálogo', icon: '📚', matchPaths: ['/catalogo'] },
  { href: '/agua', label: 'Agua', icon: '💧', matchPaths: ['/agua'], requiresEstanque: true },
  { href: '/clima', label: 'Clima', icon: '🌤️', matchPaths: ['/clima'] },
  { href: '/suelo', label: 'Suelo', icon: '🌱', matchPaths: ['/suelo'] },
]

const ADVANCED_ITEMS: DropdownItem[] = [
  { href: '/agua/planificador', label: 'Planificador de Agua', icon: '🧪', description: 'Simula escenarios antes de invertir' },
  { href: '/economia', label: 'Economía', icon: '💰', description: 'Seguimiento de costos y ganancias' },
  { href: '/economia/proyeccion', label: 'Proyección Financiera', icon: '📊', description: 'Proyecta ROI y beneficios' },
  { href: '/escenarios', label: 'Escenarios', icon: '🔮', description: 'Compara diferentes configuraciones' },
  { href: '/plagas', label: 'Plagas', icon: '🐛', description: 'Identificación y control' },
  { href: '/alertas', label: 'Alertas', icon: '🔔', description: 'Historial de notificaciones' },
]

interface PageNavProps {
  hoverColor: string
  tieneEstanque: boolean | null
}

export function PageNav({ hoverColor, tieneEstanque }: PageNavProps) {
  const pathname = usePathname()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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
    if (item.matchPaths) return item.matchPaths.some(path => path === '/' ? pathname === '/' : pathname.startsWith(path))
    return pathname === item.href
  }

  const isAdvancedActive = ADVANCED_ITEMS.some(item => pathname.startsWith(item.href))

  return (
    <div className="flex items-center">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item)
        const disabled = item.requiresEstanque && tieneEstanque === false && !active

        if (disabled) {
          return (
            <span key={item.href} className="px-3 py-2 text-sm font-medium text-white/60 cursor-not-allowed opacity-60 relative group" title="Crea un estanque en el mapa primero">
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
          <Link key={item.href} href={item.href} className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-all relative ${active ? 'bg-white text-gray-800 shadow-sm' : `text-white/80 hover:text-white ${hoverColor}`}`}>
            <span className="flex items-center gap-1.5">
              {item.icon && <span className="text-xs">{item.icon}</span>}
              {item.label}
            </span>
          </Link>
        )
      })}

      <div className="relative" ref={dropdownRef}>
        <button onClick={() => setShowAdvanced(!showAdvanced)} className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-all flex items-center gap-1.5 ${isAdvancedActive ? 'bg-white text-gray-800 shadow-sm' : `text-white/80 hover:text-white ${hoverColor}`}`}>
          <span className="text-xs">⚙️</span>
          Avanzado
          <svg className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showAdvanced && (
          <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
            {ADVANCED_ITEMS.map((advItem) => {
              const advActive = pathname.startsWith(advItem.href)
              return (
                <Link key={advItem.href} href={advItem.href} onClick={() => setShowAdvanced(false)} className={`block px-4 py-2.5 hover:bg-gray-50 transition-colors ${advActive ? 'bg-green-50 border-l-4 border-green-500' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{advItem.icon}</span>
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${advActive ? 'text-green-700' : 'text-gray-900'}`}>{advItem.label}</div>
                      {advItem.description && <div className="text-xs text-gray-500">{advItem.description}</div>}
                    </div>
                    {advActive && <span className="text-green-500 text-xs">●</span>}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
