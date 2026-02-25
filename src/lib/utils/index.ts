import type { UUID, Timestamp } from '@/types'
export { getTemporadaActual } from '@/lib/data/clima-arica'

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

export function formatArea(m2: number): string {
  return `${m2.toLocaleString('es-CL')} m²`
}

export function formatCLP(n: number): string {
  return '$' + Math.round(n).toLocaleString('es-CL')
}
