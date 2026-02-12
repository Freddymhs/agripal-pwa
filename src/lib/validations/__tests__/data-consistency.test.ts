import { describe, it, expect } from 'vitest'
import { KC_POR_CULTIVO } from '@/lib/data/kc-cultivos'
import { DURACION_ETAPAS } from '@/lib/data/duracion-etapas'

// Cultivos esperados del catálogo Arica
const CULTIVOS_ARICA = [
  'tuna',
  'higuera',
  'pitahaya',
  'guayaba',
  'datil',
  'maracuya',
  'uva',
  'limon',
  'mandarina',
  'arandano',
  'lucuma',
  'zapote',
]

describe('Data Consistency', () => {
  describe('Kc Coverage', () => {
    it('todos los cultivos de Arica tienen cobertura Kc', () => {
      const faltantes: string[] = []

      for (const cultivo of CULTIVOS_ARICA) {
        const encontrado = Object.keys(KC_POR_CULTIVO).some(
          kc => kc.toLowerCase() === cultivo.toLowerCase()
        )
        if (!encontrado) {
          faltantes.push(cultivo)
        }
      }

      expect(faltantes).toEqual(
        [],
        `Cultivos sin cobertura Kc: ${faltantes.join(', ')}`
      )
    })

    it('todos los Kc tienen las 4 etapas requeridas', () => {
      const etapasRequeridas = ['plántula', 'joven', 'adulta', 'madura']
      const problemas: string[] = []

      for (const [cultivo, kcs] of Object.entries(KC_POR_CULTIVO)) {
        const etapas = Object.keys(kcs)
        const faltantes = etapasRequeridas.filter(e => !etapas.includes(e))

        if (faltantes.length > 0) {
          problemas.push(`${cultivo}: falta ${faltantes.join(', ')}`)
        }

        // Verificar rango de valores Kc (0.3 - 1.3)
        for (const [etapa, valor] of Object.entries(kcs)) {
          if (valor < 0.3 || valor > 1.3) {
            problemas.push(
              `${cultivo}.${etapa}: valor ${valor} fuera de rango [0.3-1.3]`
            )
          }
        }
      }

      expect(problemas).toEqual([], problemas.join('\n'))
    })
  })

  describe('Duration Coverage', () => {
    it('todos los cultivos de Arica tienen cobertura de duración', () => {
      const faltantes: string[] = []

      for (const cultivo of CULTIVOS_ARICA) {
        const encontrado = Object.keys(DURACION_ETAPAS).some(
          d => d.toLowerCase() === cultivo.toLowerCase()
        )
        if (!encontrado) {
          faltantes.push(cultivo)
        }
      }

      expect(faltantes).toEqual(
        [],
        `Cultivos sin cobertura de duración: ${faltantes.join(', ')}`
      )
    })

    it('todas las duraciones tienen las 4 etapas requeridas', () => {
      const etapasRequeridas = ['plántula', 'joven', 'adulta', 'madura']
      const problemas: string[] = []

      for (const [cultivo, duraciones] of Object.entries(DURACION_ETAPAS)) {
        const etapas = Object.keys(duraciones)
        const faltantes = etapasRequeridas.filter(e => !etapas.includes(e))

        if (faltantes.length > 0) {
          problemas.push(`${cultivo}: falta ${faltantes.join(', ')}`)
        }

        // Verificar que valores sean positivos
        for (const [etapa, dias] of Object.entries(duraciones)) {
          if (dias < 0 || !Number.isInteger(dias)) {
            problemas.push(
              `${cultivo}.${etapa}: valor inválido ${dias} (debe ser número positivo entero)`
            )
          }
        }

        // Total de días debe ser razonable (entre 30 días y 40 años)
        const totalDias = Object.values(duraciones).reduce((a, b) => a + b, 0)
        if (totalDias < 30 || totalDias > 14600) {
          problemas.push(
            `${cultivo}: total ${totalDias} días fuera de rango [30-14600]`
          )
        }
      }

      expect(problemas).toEqual([], problemas.join('\n'))
    })
  })

  describe('Cross-file Consistency', () => {
    it('KC y Duración tienen la misma lista de cultivos', () => {
      const kcKeys = Object.keys(KC_POR_CULTIVO).sort()
      const dKeys = Object.keys(DURACION_ETAPAS).sort()

      expect(kcKeys).toEqual(dKeys)
    })
  })

  describe('Field Validation', () => {
    it('cultivos de Arica tienen campos requeridos', () => {
      // Este test requeriría cargar el JSON, se puede extender luego
      // Por ahora verificamos que kc-cultivos y duracion-etapas cubren los IDs esperados
      const cultivosIdsEsperados = [
        'cultivo-tuna',
        'cultivo-higuera',
        'cultivo-pitahaya',
        'cultivo-guayaba',
        'cultivo-datil-medjool',
        'cultivo-maracuya',
        'cultivo-uva-mesa-primor',
        'cultivo-limon',
        'cultivo-mandarina-w-murcott',
        'cultivo-arandano-maceta',
        'cultivo-lucuma',
        'cultivo-zapote-blanco',
      ]

      // Mapeo de IDs a claves en KC/Duracion
      const mapping: Record<string, string> = {
        'cultivo-tuna': 'tuna',
        'cultivo-higuera': 'higuera',
        'cultivo-pitahaya': 'pitahaya',
        'cultivo-guayaba': 'guayaba',
        'cultivo-datil-medjool': 'datil',
        'cultivo-maracuya': 'maracuya',
        'cultivo-uva-mesa-primor': 'uva',
        'cultivo-limon': 'limon',
        'cultivo-mandarina-w-murcott': 'mandarina',
        'cultivo-arandano-maceta': 'arandano',
        'cultivo-lucuma': 'lucuma',
        'cultivo-zapote-blanco': 'zapote',
      }

      const faltantes: string[] = []
      for (const [id, clave] of Object.entries(mapping)) {
        if (
          !KC_POR_CULTIVO[clave] ||
          !DURACION_ETAPAS[clave]
        ) {
          faltantes.push(id)
        }
      }

      expect(faltantes).toEqual([], `IDs sin cobertura: ${faltantes.join(', ')}`)
    })
  })
})
