'use client'

import { type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useOptionalProjectContext } from '@/contexts/project-context'
import { TIPO_ZONA } from '@/lib/constants/entities'
import { PageNav } from '@/components/layout/page-nav'

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

export function PageLayout({ children, title, headerColor = 'green', headerActions }: PageLayoutProps) {
  const pathname = usePathname()
  const projectCtx = useOptionalProjectContext()

  const bgColor = HEADER_COLORS[headerColor]
  const hoverColor = HEADER_HOVER_COLORS[headerColor]
  const borderColor = HEADER_BORDER_COLORS[headerColor]
  const tieneEstanque = projectCtx?.zonas?.some(z => z.tipo === TIPO_ZONA.ESTANQUE) ?? null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className={`${bgColor} text-white`}>
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-1">
            <Link href="/" className="text-xl font-bold mr-4 hover:opacity-80 transition-opacity">
              AgriPlan
            </Link>

            <PageNav hoverColor={hoverColor} tieneEstanque={tieneEstanque} />

            {title && (
              <div className={`ml-4 pl-4 border-l ${borderColor}`}>
                <h1 className="text-lg font-semibold">{title}</h1>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {headerActions}
            <Link
              href="/guia"
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${pathname === '/guia' ? 'bg-white text-gray-800' : `text-white/80 hover:text-white ${hoverColor}`}`}
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
