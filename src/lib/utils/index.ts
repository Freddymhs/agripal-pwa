import type { UUID, Timestamp, Temporada } from '@/types'

export function generateUUID(): UUID {
  return crypto.randomUUID()
}

export function getCurrentTimestamp(): Timestamp {
  return new Date().toISOString()
}

export function parseTimestamp(timestamp: Timestamp): Date {
  return new Date(timestamp)
}

export function formatDate(timestamp: Timestamp, locale = 'es-CL'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(parseTimestamp(timestamp))
}

export function getTemporadaActual(): Temporada {
  const mes = new Date().getMonth() + 1

  if (mes >= 12 || mes <= 2) return 'verano'
  if (mes >= 3 && mes <= 5) return 'otoño'
  if (mes >= 6 && mes <= 8) return 'invierno'
  return 'primavera'
}

export function formatArea(m2: number): string {
  return `${m2.toLocaleString('es-CL')} m²`
}

export function formatPesos(clp: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(clp)
}
