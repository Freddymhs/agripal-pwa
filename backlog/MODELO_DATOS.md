# Modelo de Datos - AgriPlan PWA

Referencia completa de tipos TypeScript para todo el proyecto.

---

## Tipos Base

```typescript
export type UUID = string
export type Timestamp = string // ISO 8601

// Unidades de medida (type aliases para claridad)
export type Metros = number
export type MetrosCuadrados = number
export type MetrosCubicos = number
export type Kilogramos = number
export type LitrosPorHora = number
export type PesosCLP = number
```

---

## Usuario

```typescript
export interface Usuario {
  id: UUID
  email: string
  nombre: string
  created_at: Timestamp
  updated_at: Timestamp
}
```

---

## Proyecto

```typescript
export interface Proyecto {
  id: UUID
  usuario_id: UUID
  nombre: string
  ubicacion_referencia: string // "Arica, Chile"
  created_at: Timestamp
  updated_at: Timestamp
}
```

---

## Terreno

```typescript
export interface SistemaRiego {
  litros_hora: LitrosPorHora
  descuento_auto: boolean
  ultima_actualizacion: Timestamp
}

export interface Terreno {
  id: UUID
  proyecto_id: UUID
  nombre: string

  // Dimensiones (siempre rectángulo)
  ancho_m: Metros
  alto_m: Metros
  area_m2: MetrosCuadrados // calculado: ancho * alto

  // Agua
  agua_disponible_m3: MetrosCubicos // capacidad total aljibe
  agua_actual_m3: MetrosCubicos     // agua disponible ahora
  sistema_riego: SistemaRiego

  created_at: Timestamp
  updated_at: Timestamp
}
```

---

## Zona

```typescript
export type TipoZona = 'cultivo' | 'bodega' | 'casa' | 'camino' | 'decoracion' | 'otro'
export type EstadoZona = 'activa' | 'vacia' | 'en_preparacion'

export interface Zona {
  id: UUID
  terreno_id: UUID
  nombre: string
  tipo: TipoZona
  estado: EstadoZona

  // Posición y tamaño (siempre rectángulo, en metros)
  x: Metros
  y: Metros
  ancho: Metros
  alto: Metros
  area_m2: MetrosCuadrados // calculado

  // Visual
  color: string // hex

  // Override de riego (opcional, si es diferente al terreno)
  sistema_riego_override?: SistemaRiego

  notas: string
  created_at: Timestamp
  updated_at: Timestamp
}

// Colores por defecto según tipo
export const COLORES_ZONA: Record<TipoZona, string> = {
  cultivo: '#22c55e',     // verde
  bodega: '#a16207',      // marrón
  casa: '#3b82f6',        // azul
  camino: '#6b7280',      // gris
  decoracion: '#a855f7',  // púrpura
  otro: '#374151',        // gris oscuro
}
```

---

## Planta

```typescript
export type EstadoPlanta = 'plantada' | 'creciendo' | 'produciendo' | 'muerta'

export interface Planta {
  id: UUID
  zona_id: UUID
  tipo_cultivo_id: UUID

  // Posición dentro de la zona (metros relativos a la zona)
  x: Metros
  y: Metros

  estado: EstadoPlanta
  fecha_plantacion: Timestamp
  notas: string

  created_at: Timestamp
  updated_at: Timestamp
}

// Colores visuales según estado
export const COLORES_ESTADO_PLANTA: Record<EstadoPlanta, string> = {
  plantada: '#84cc16',    // lime
  creciendo: '#22c55e',   // green
  produciendo: '#f59e0b', // amber
  muerta: '#6b7280',      // gray
}
```

---

## Catálogo de Cultivos

```typescript
export type Tolerancia = 'alta' | 'media' | 'baja' | 'muy_baja'
export type ToleranciaSimple = 'alta' | 'media' | 'baja'
export type Tier = 1 | 2 | 3
export type Riesgo = 'bajo' | 'medio' | 'alto'

export interface CatalogoCultivo {
  id: UUID
  proyecto_id: UUID // El catálogo es POR PROYECTO, editable

  nombre: string
  nombre_cientifico?: string

  // Agua (m³/hectárea/año)
  agua_m3_ha_año_min: MetrosCubicos
  agua_m3_ha_año_max: MetrosCubicos

  // Espaciado entre plantas
  espaciado_min_m: Metros       // mínimo absoluto (0.5m)
  espaciado_recomendado_m: Metros

  // Tolerancias
  tolerancia_boro: Tolerancia
  tolerancia_salinidad: ToleranciaSimple

  // Tiempos
  tiempo_produccion_meses: number
  vida_util_años: number

  // Precios referencia (CLP/kg)
  precio_kg_min_clp: PesosCLP
  precio_kg_max_clp: PesosCLP

  // Clasificación
  tier: Tier
  riesgo: Riesgo

  notas: string
  created_at: Timestamp
  updated_at: Timestamp
}
```

---

## Entrada de Agua

```typescript
export interface EntradaAgua {
  id: UUID
  terreno_id: UUID

  fecha: Timestamp
  cantidad_m3: MetrosCubicos
  costo_clp?: PesosCLP
  proveedor?: string
  notas: string

  created_at: Timestamp
}
```

---

## Cosecha

```typescript
export type CalidadCosecha = 'A' | 'B' | 'C'

export interface Cosecha {
  id: UUID
  zona_id: UUID
  tipo_cultivo_id: UUID

  fecha: Timestamp
  cantidad_kg: Kilogramos
  calidad: CalidadCosecha

  vendido: boolean
  precio_venta_clp?: PesosCLP
  destino?: string
  foto_url?: string
  notas: string

  created_at: Timestamp
}
```

---

## Alertas

```typescript
export type TipoAlerta =
  | 'deficit_agua'
  | 'espaciado_incorrecto'
  | 'zona_sin_cultivo'
  | 'planta_muerta'
  | 'cosecha_pendiente'
  | 'mantenimiento'

export type SeveridadAlerta = 'info' | 'warning' | 'critical'
export type EstadoAlerta = 'activa' | 'resuelta' | 'ignorada'

export interface Alerta {
  id: UUID
  terreno_id: UUID
  zona_id?: UUID
  planta_id?: UUID

  tipo: TipoAlerta
  severidad: SeveridadAlerta
  estado: EstadoAlerta

  titulo: string
  descripcion: string
  sugerencia?: string

  fecha_resolucion?: Timestamp
  como_se_resolvio?: string

  created_at: Timestamp
  updated_at: Timestamp
}
```

---

## Historial de Cambios

```typescript
export type TipoAccion =
  | 'crear_proyecto'
  | 'crear_terreno'
  | 'crear_zona'
  | 'editar_zona'
  | 'eliminar_zona'
  | 'redimensionar_zona'
  | 'crear_planta'
  | 'mover_planta'
  | 'eliminar_planta'
  | 'cambiar_estado_planta'
  | 'entrada_agua'
  | 'registrar_cosecha'
  | 'resolver_alerta'
  | 'cambiar_configuracion'

export interface HistorialEntrada {
  id: UUID
  usuario_id: UUID
  proyecto_id?: UUID
  terreno_id?: UUID
  zona_id?: UUID
  planta_id?: UUID

  tipo_accion: TipoAccion
  descripcion: string
  datos_anteriores?: Record<string, unknown>
  datos_nuevos?: Record<string, unknown>

  created_at: Timestamp
}
```

---

## Sync Queue (Offline)

```typescript
export type SyncEstado = 'pendiente' | 'sincronizando' | 'completado' | 'error' | 'conflicto'
export type SyncEntidad = 'proyecto' | 'terreno' | 'zona' | 'planta' | 'entrada_agua' | 'cosecha' | 'alerta' | 'catalogo'
export type SyncAccion = 'crear' | 'actualizar' | 'eliminar'

export interface SyncItem {
  id: UUID
  entidad: SyncEntidad
  entidad_id: UUID
  accion: SyncAccion
  datos: Record<string, unknown>
  estado: SyncEstado
  intentos: number
  error?: string

  // Para resolución de conflictos
  datos_servidor?: Record<string, unknown>
  resuelto_por?: 'local' | 'servidor' | 'manual'

  created_at: Timestamp
  updated_at: Timestamp
}
```

---

## Dashboard Métricas

```typescript
export type Temporada = 'verano' | 'otoño' | 'invierno' | 'primavera'
export type EstadoAgua = 'ok' | 'ajustado' | 'deficit'

// Factores de consumo por temporada
export const FACTORES_TEMPORADA: Record<Temporada, number> = {
  verano: 1.4,
  otoño: 1.0,
  invierno: 0.6,
  primavera: 1.2,
}

export interface DashboardTerreno {
  terreno_id: UUID

  // Área
  area_total_m2: MetrosCuadrados
  area_usada_m2: MetrosCuadrados
  area_libre_m2: MetrosCuadrados
  porcentaje_uso: number

  // Agua
  agua_disponible_m3: MetrosCubicos
  agua_necesaria_m3: MetrosCubicos
  agua_margen_m3: MetrosCubicos
  estado_agua: EstadoAgua

  // Plantas
  total_plantas: number
  plantas_por_cultivo: Record<string, number>
  plantas_produciendo: number
  plantas_muertas: number

  // Alertas
  alertas_activas: number
  alertas_criticas: number

  // Contexto
  temporada_actual: Temporada
  factor_temporada: number
}
```

---

## Configuración Dexie (IndexedDB)

```typescript
import Dexie, { type Table } from 'dexie'

export class AgriPlanDB extends Dexie {
  usuarios!: Table<Usuario>
  proyectos!: Table<Proyecto>
  terrenos!: Table<Terreno>
  zonas!: Table<Zona>
  plantas!: Table<Planta>
  catalogo_cultivos!: Table<CatalogoCultivo>
  entradas_agua!: Table<EntradaAgua>
  cosechas!: Table<Cosecha>
  alertas!: Table<Alerta>
  historial!: Table<HistorialEntrada>
  sync_queue!: Table<SyncItem>

  constructor() {
    super('AgriPlanDB')

    this.version(1).stores({
      usuarios: 'id, email',
      proyectos: 'id, usuario_id, nombre',
      terrenos: 'id, proyecto_id, nombre',
      zonas: 'id, terreno_id, tipo, nombre',
      plantas: 'id, zona_id, tipo_cultivo_id, estado',
      catalogo_cultivos: 'id, proyecto_id, nombre, tier',
      entradas_agua: 'id, terreno_id, fecha',
      cosechas: 'id, zona_id, tipo_cultivo_id, fecha',
      alertas: 'id, terreno_id, tipo, estado, severidad',
      historial: 'id, usuario_id, terreno_id, tipo_accion, created_at',
      sync_queue: 'id, entidad, estado, created_at',
    })
  }
}

export const db = new AgriPlanDB()
```
