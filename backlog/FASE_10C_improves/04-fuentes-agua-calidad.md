# 04: Fuentes de Agua y Calidad

**Status**: Completada
**Prioridad**: Media-Alta
**Dependencias**: 02-estanques-funcionales, FASE_5D

---

## Problema

- Los estanques no tienen relación con una fuente de agua específica
- No se sabe la calidad del agua (boro, salinidad, arsénico)
- No se puede evaluar si el agua es apta para cada cultivo
- Los proveedores existen en el modelo (`EntradaAgua`) pero no se gestionan desde UI

## Solución

### 4.1 Modelo de Fuente de Agua

Ya existe parcialmente en FASE_5D. Cada estanque se relaciona con una fuente:

```typescript
interface FuenteAgua {
  id: string
  nombre: string // "Aljibe Municipal", "Pozo Norte", "Río Lluta"
  tipo: 'aljibe' | 'pozo' | 'rio' | 'canal' | 'reciclada' | 'otro'
  proveedor?: string

  // Calidad
  salinidad_dS_m?: number
  boro_ppm?: number
  arsenico_mg_l?: number
  ph?: number

  // Análisis
  fecha_ultimo_analisis?: string
  laboratorio?: string

  // Costo
  costo_m3?: number
}
```

### 4.2 Compatibilidad agua ↔ cultivo

Cada `CatalogoCultivo` ya tiene:
- `boro_tolerancia_ppm`
- `salinidad_tolerancia_dS_m`
- `tolerancia_boro`: alta/media/baja/muy_baja
- `tolerancia_salinidad`: alta/media/baja

Cruzar estos datos con la fuente para mostrar:
- "Agua del Lluta (11 ppm boro) → Olivo: COMPATIBLE (tolerancia alta)"
- "Agua del Lluta (11 ppm boro) → Papaya: NO COMPATIBLE (tolerancia baja, máx 1 ppm)"

### 4.3 UI

- Al seleccionar estanque: sección "Fuente de agua" con datos de calidad
- Alertas automáticas si agua no es compatible con cultivos de zonas conectadas
- Página `/agua/configuracion`: gestionar fuentes y proveedores

## Datos estáticos disponibles

- `CatalogoCultivo` ya tiene tolerancias de boro, salinidad
- `data/static/` puede tener un nuevo archivo `fuentes-agua-arica.json` con fuentes típicas de la zona
- FASE_5D ya definió el modelo `calidad_agua` en el tipo `Terreno`

## Archivos a crear/modificar

- `data/static/fuentes-agua/arica.json` — fuentes típicas de Arica
- `src/types/index.ts` — tipo `FuenteAgua`
- `src/lib/validations/agua.ts` — crear validación compatibilidad agua↔cultivo
- `src/app/agua/configuracion/page.tsx` — conectar con estanques reales
