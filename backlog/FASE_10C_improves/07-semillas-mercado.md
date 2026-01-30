# 07: Semillas, Mercado y Técnicas de Crecimiento

**Status**: Completada
**Prioridad**: Baja-Media
**Dependencias**: 04-fuentes-agua-calidad, 05-suelo-nutrientes

---

## Problema

- No se diferencia entre variedades/semillas de un mismo cultivo
- No hay datos de mercado para decidir qué plantar
- No se registran técnicas de mejora de crecimiento (tierra líquida, extracto de algas, etc.)

## Solución

### 7.1 Variedades de cultivo

Cada cultivo puede tener variedades con diferencias en:
- Resistencia a condiciones adversas
- Tiempo de producción
- Rendimiento
- Calidad del fruto

```typescript
interface VariedadCultivo {
  id: string
  cultivo_id: string
  nombre: string // "Olivo Arbequina", "Olivo Picual"
  origen?: string // "España", "Chile"
  ventajas: string[]
  desventajas: string[]
  rendimiento_relativo: number // 1.0 = base, 1.2 = 20% más
  precio_planta_clp?: number
}
```

### 7.2 Datos de mercado

Para decidir qué plantar según rentabilidad:

```typescript
interface DatosMercado {
  cultivo_id: string
  precio_kg_actual_clp: number
  tendencia: 'alza' | 'estable' | 'baja'
  demanda_local: 'alta' | 'media' | 'baja'
  competencia_local: 'alta' | 'media' | 'baja'
  mercado_exportacion: boolean
}
```

### 7.3 Técnicas de mejora

Registro de aplicaciones especiales:
- **Tierra líquida**: duplica retención de agua en suelo
- **Extracto de algas**: mejora crecimiento (investigación universitaria)
- **Micorrizas**: mejora absorción de nutrientes
- Cada técnica tiene: efecto esperado, costo, frecuencia de aplicación

### 7.4 Datos estáticos

- `data/static/cultivos/variedades-arica.json` — variedades por cultivo
- `data/static/mercado/precios-arica.json` — precios de referencia
- `data/static/tecnicas/mejora-crecimiento.json` — tierra líquida, algas, etc.

## Datos estáticos disponibles

- `CatalogoCultivo` ya tiene `precio_kg_min_clp/max_clp`
- `CatalogoCultivo` ya tiene `tier` y `riesgo`
- `CatalogoCultivo.notas_arica` — contexto local
