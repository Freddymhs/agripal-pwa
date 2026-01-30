'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import type { Alerta } from '@/types'

interface AlertasDropdownProps {
  alertas: Alerta[]
  alertasCriticas: number
}

export function AlertasDropdown({ alertas, alertasCriticas }: AlertasDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const ultimasAlertas = alertas.slice(0, 5)

  const severidadConfig = {
    critical: { icon: '🚨', color: 'text-red-600' },
    warning: { icon: '⚠️', color: 'text-yellow-600' },
    info: { icon: 'ℹ️', color: 'text-blue-600' },
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-green-100 hover:text-white text-sm flex items-center gap-1 p-1"
        aria-label="Alertas"
      >
        <BellIcon />
        {alertasCriticas > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
            {alertasCriticas}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Alertas</h3>
              <span className="text-sm text-gray-500">
                {alertas.length} activas
              </span>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {ultimasAlertas.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                ✅ No hay alertas activas
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {ultimasAlertas.map((alerta) => {
                  const config = severidadConfig[alerta.severidad]
                  return (
                    <div
                      key={alerta.id}
                      className="p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-sm">{config.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${config.color} truncate`}>
                            {alerta.titulo}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {alerta.descripcion}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {alertas.length > 0 && (
            <div className="p-2 border-t border-gray-100">
              <Link
                href="/alertas"
                onClick={() => setIsOpen(false)}
                className="block w-full text-center text-sm text-green-600 hover:text-green-700 font-medium py-2 hover:bg-green-50 rounded"
              >
                Ver todas las alertas →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function BellIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
      />
    </svg>
  )
}
