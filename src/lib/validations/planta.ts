import type { Planta, Zona, CatalogoCultivo } from '@/types'

export interface ValidationResult {
  valida: boolean
  error?: string
  advertencia?: string
}

function distancia(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
}

export function validarNuevaPlanta(
  posicion: { x: number; y: number },
  zona: Zona,
  plantasExistentes: Planta[],
  cultivo: CatalogoCultivo
): ValidationResult {
  if (zona.tipo !== 'cultivo') {
    return { valida: false, error: 'Solo puedes plantar en zonas de tipo "cultivo"' }
  }

  if (!cultivo.espaciado_recomendado_m) {
    return { valida: false, error: `El cultivo "${cultivo.nombre}" no tiene espaciado configurado` }
  }

  const espaciado = cultivo.espaciado_recomendado_m
  const margenBorde = espaciado / 2

  const distIzquierda = posicion.x
  const distDerecha = zona.ancho - posicion.x
  const distArriba = posicion.y
  const distAbajo = zona.alto - posicion.y

  const problemas: string[] = []

  if (distIzquierda < margenBorde) {
    problemas.push(`• Borde izquierdo: ${distIzquierda.toFixed(2)}m`)
  }
  if (distDerecha < margenBorde) {
    problemas.push(`• Borde derecho: ${distDerecha.toFixed(2)}m`)
  }
  if (distArriba < margenBorde) {
    problemas.push(`• Borde superior: ${distArriba.toFixed(2)}m`)
  }
  if (distAbajo < margenBorde) {
    problemas.push(`• Borde inferior: ${distAbajo.toFixed(2)}m`)
  }

  for (const planta of plantasExistentes) {
    if (planta.zona_id !== zona.id) continue

    const dist = distancia(posicion, planta)
    if (dist < espaciado) {
      problemas.push(`• Otra planta: ${dist.toFixed(2)}m`)
    }
  }

  if (problemas.length > 0) {
    return {
      valida: false,
      error: `No se puede plantar aquí:\n${problemas.join('\n')}\n\n${cultivo.nombre} necesita:\n• ${margenBorde}m del borde\n• ${espaciado}m entre plantas`,
    }
  }

  return { valida: true }
}

export interface GridParams {
  margenX: number
  margenY: number
  espaciado: number
  columnas: number
  filas: number
}

export function calcularGridParams(zona: Zona, espaciado: number): GridParams | null {
  const margenBorde = espaciado / 2

  const anchoDisponible = zona.ancho - (margenBorde * 2)
  const altoDisponible = zona.alto - (margenBorde * 2)

  if (anchoDisponible <= 0 || altoDisponible <= 0) return null

  const columnas = Math.floor(anchoDisponible / espaciado) + 1
  const filas = Math.floor(altoDisponible / espaciado) + 1

  if (columnas <= 0 || filas <= 0) return null

  const anchoGrid = (columnas - 1) * espaciado
  const altoGrid = (filas - 1) * espaciado

  const margenX = (zona.ancho - anchoGrid) / 2
  const margenY = (zona.alto - altoGrid) / 2

  return { margenX, margenY, espaciado, columnas, filas }
}

export function snapToGrid(
  mouseX: number,
  mouseY: number,
  gridParams: GridParams,
  ocupadas: Set<string>
): { x: number; y: number } | null {
  const { margenX, margenY, espaciado, columnas, filas } = gridParams

  const nearestCol = Math.round((mouseX - margenX) / espaciado)
  const nearestRow = Math.round((mouseY - margenY) / espaciado)

  const col = Math.max(0, Math.min(columnas - 1, nearestCol))
  const row = Math.max(0, Math.min(filas - 1, nearestRow))

  const key = `${col},${row}`
  if (ocupadas.has(key)) return null

  return {
    x: margenX + col * espaciado,
    y: margenY + row * espaciado,
  }
}

export function generarGridPlantas(
  zona: Zona,
  espaciado: number,
  cultivo: CatalogoCultivo
): Array<{ x: number; y: number }> {
  if (!cultivo.espaciado_recomendado_m) return []

  const espaciadoFinal = Math.max(espaciado, cultivo.espaciado_recomendado_m)
  const params = calcularGridParams(zona, espaciadoFinal)
  if (!params) return []

  const posiciones: Array<{ x: number; y: number }> = []

  for (let fila = 0; fila < params.filas; fila++) {
    for (let col = 0; col < params.columnas; col++) {
      posiciones.push({
        x: params.margenX + (col * params.espaciado),
        y: params.margenY + (fila * params.espaciado),
      })
    }
  }

  return posiciones
}

export function validarGridPlantas(
  posiciones: Array<{ x: number; y: number }>,
  zona: Zona,
  plantasExistentes: Planta[],
  cultivo: CatalogoCultivo
): {
  validas: Array<{ x: number; y: number }>
  invalidas: Array<{ x: number; y: number; razon: string }>
} {
  const validas: Array<{ x: number; y: number }> = []
  const invalidas: Array<{ x: number; y: number; razon: string }> = []

  if (!cultivo.espaciado_recomendado_m) {
    return { validas: [], invalidas: [] }
  }

  const espaciado = cultivo.espaciado_recomendado_m

  for (const pos of posiciones) {
    let conflicto = false
    for (const planta of plantasExistentes) {
      if (planta.zona_id !== zona.id) continue

      const dist = distancia(pos, planta)
      if (dist < espaciado) {
        invalidas.push({ ...pos, razon: 'Muy cerca de planta existente' })
        conflicto = true
        break
      }
    }

    if (!conflicto) {
      validas.push(pos)
    }
  }

  return { validas, invalidas }
}
