# Modelo de Datos - AgriPlan PWA

Referencia completa de tipos TypeScript. Refleja el estado actual de `src/types/index.ts`.

**Ultima actualización**: 2026-02-09

---

## Tipos Base

```typescript
export type UUID = string
export type Timestamp = string // ISO 8601

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
  ubicacion_referencia: string
  created_at: Timestamp
  updated_at: Timestamp
  lastModified?: Timestamp
}
```

---

## Terreno

### Sub-tipos del Terreno

```typescript
export interface SistemaRiego {
  litros_hora: LitrosPorHora
  descuento_auto: boolean
  ultima_actualizacion: Timestamp
}

export interface UbicacionTerreno {
  region?: string
  comuna?: string
  coordenadas?: string
  direccion?: string
}

export type TipoPropiedad = 'propio' | 'arriendo' | 'comodato' | 'sucesion'

export interface PermisosLegales {
  permiso_edificacion?: boolean
  resolucion_sanitaria?: boolean
  declaracion_sii?: boolean
  patente_municipal?: boolean
}

export interface RegistroAgricola {
  inscripcion_sag?: boolean
  rut_agricola?: string
  registro_indap?: boolean
}

export interface DerechosAgua {
  tiene_derechos_dga?: boolean
  litros_por_segundo?: number
  inscripcion_junta_vigilancia?: boolean
}

export interface SegurosTerreno {
  seguro_agricola?: boolean
  seguro_incendio?: boolean
  costo_anual_clp?: number
}

export interface LegalTerreno {
  tipo_propiedad?: TipoPropiedad
  titulo_saneado?: boolean
  rol_sii?: string
  contribuciones_al_dia?: boolean
  permisos?: PermisosLegales
  registro_agricola?: RegistroAgricola
  derechos_agua?: DerechosAgua
  seguros?: SegurosTerreno
}

export interface DistanciasTerreno {
  pueblo_cercano_km?: number
  ciudad_principal_km?: number
  hospital_km?: number
  ferreteria_agricola_km?: number
  mercado_mayorista_km?: number
}

export type CalidadSenal = 'buena' | 'regular' | 'mala'
export type TipoInternet = 'fibra' | '4g' | 'satelital'

export interface ConectividadTerreno {
  señal_celular?: boolean
  operador_celular?: string
  calidad_señal?: CalidadSenal
  internet_disponible?: boolean
  tipo_internet?: TipoInternet
}

export type TipoAcceso = 'pavimentado' | 'ripio' | 'tierra' | 'inexistente'
export type EstadoCerco = 'completo' | 'parcial' | 'sin_cerco'

export interface InfraestructuraTerreno {
  acceso?: TipoAcceso
  cerco?: EstadoCerco
  electricidad?: boolean
  agua_potable?: boolean
}
```

### Suelo

```typescript
export type TexturaSuelo = 'arenosa' | 'franco-arenosa' | 'franco' | 'franco-arcillosa' | 'arcillosa'
export type DrenajeSuelo = 'rapido' | 'bueno' | 'moderado' | 'lento'

export interface AnalisisFisicoSuelo {
  ph?: number
  textura?: TexturaSuelo
  drenaje?: DrenajeSuelo
  profundidad_efectiva_cm?: number
  materia_organica_pct?: number
}

export interface AnalisisQuimicoSuelo {
  analisis_realizado?: boolean
  fecha_analisis?: string
  laboratorio?: string
  salinidad_dS_m?: number
  boro_mg_l?: number
  arsenico_mg_l?: number
  nitrogeno_ppm?: number
  fosforo_ppm?: number
  potasio_ppm?: number
  calcio_ppm?: number
  magnesio_ppm?: number
}

export interface SueloTerreno {
  fisico?: AnalisisFisicoSuelo
  quimico?: AnalisisQuimicoSuelo
}
```

### Agua Avanzada

```typescript
export type FuenteAguaDetallada = 'lluta' | 'azapa' | 'aljibe' | 'pozo' | 'otro'
export type ConfiabilidadProveedor = 'alta' | 'media' | 'baja'

export interface CalidadAguaTerreno {
  analisis_realizado?: boolean
  fecha_analisis?: string
  laboratorio?: string
  fuente?: FuenteAguaDetallada
  salinidad_dS_m?: number
  boro_ppm?: number
  arsenico_mg_l?: number
  requiere_filtrado?: boolean
  costo_filtrado_mensual?: number
}

export interface ProveedorAgua {
  id: string
  nombre: string
  telefono?: string
  precio_m3_clp?: number
  confiabilidad?: ConfiabilidadProveedor
  es_principal?: boolean
  notas?: string
}

export interface DerechosAguaDGA {
  tiene_derechos_dga?: boolean
  litros_por_segundo?: number
  m3_mes_autorizado?: number
  fuente_oficial?: string
  inscripcion_dga?: string
}

export interface ContingenciasAgua {
  buffer_minimo_pct?: number
  alerta_critica_pct?: number
  plan_si_no_llega?: string[]
}

export interface TecnicasAhorroAgua {
  riego_deficitario_controlado?: boolean
  hidrogel?: boolean
  mulch?: boolean
  sensores_humedad?: boolean
}

export interface AguaAvanzadaTerreno {
  calidad?: CalidadAguaTerreno
  proveedores?: ProveedorAgua[]
  derechos?: DerechosAguaDGA
  contingencias?: ContingenciasAgua
  tecnicas_ahorro?: TecnicasAhorroAgua
}
```

### Terreno (interfaz principal)

```typescript
export interface Terreno {
  id: UUID
  proyecto_id: UUID
  nombre: string
  ancho_m: Metros
  alto_m: Metros
  area_m2: MetrosCuadrados

  // Agua básica
  agua_disponible_m3: MetrosCubicos
  agua_recarga_anual_m3?: MetrosCubicos
  agua_actual_m3: MetrosCubicos
  agua_fuente?: 'aljibe' | 'pozo' | 'riego' | 'lluvia'
  agua_confiabilidad?: 'alta' | 'media' | 'baja'
  agua_costo_clp_por_m3?: number
  agua_calidad_salinidad_dS_m?: number
  agua_calidad_boro_ppm?: number
  agua_calidad_arsenico_ppm?: number

  // Suelo básico
  suelo_ph?: number
  suelo_materia_organica_porciento?: number
  suelo_textura?: string

  sistema_riego: SistemaRiego

  // Avanzado (sub-objetos)
  ubicacion?: UbicacionTerreno
  legal?: LegalTerreno
  distancias?: DistanciasTerreno
  conectividad?: ConectividadTerreno
  infraestructura?: InfraestructuraTerreno
  suelo?: SueloTerreno
  agua_avanzada?: AguaAvanzadaTerreno
  ultima_simulacion_agua?: Timestamp

  created_at: Timestamp
  updated_at: Timestamp
  lastModified?: Timestamp
}
```

---

## Zona

### Estanque

```typescript
export type MaterialEstanque = 'plastico' | 'cemento' | 'geomembrana' | 'metalico'

export interface ConfiguracionRecarga {
  frecuencia_dias: number
  cantidad_litros: number
  ultima_recarga: Timestamp
  proxima_recarga: Timestamp
  costo_recarga_clp?: number
}

export interface EstanqueConfig {
  capacidad_m3: MetrosCubicos
  nivel_actual_m3: MetrosCubicos
  fuente_id?: string
  material?: MaterialEstanque
  tiene_tapa?: boolean
  tiene_filtro?: boolean
  recarga?: ConfiguracionRecarga
}
```

### Riego

```typescript
export type TipoSistemaRiego = 'continuo_24_7' | 'programado'

export interface ConfiguracionRiego {
  tipo: TipoSistemaRiego
  caudal_total_lh: number
  horas_dia?: number
  horario_inicio?: string
  horario_fin?: string
}
```

### Zona (interfaz principal)

```typescript
export type TipoZona = 'cultivo' | 'bodega' | 'casa' | 'camino' | 'decoracion' | 'estanque' | 'otro'
export type EstadoZona = 'activa' | 'vacia' | 'en_preparacion'

export interface Zona {
  id: UUID
  terreno_id: UUID
  nombre: string
  tipo: TipoZona
  estado: EstadoZona
  x: Metros
  y: Metros
  ancho: Metros
  alto: Metros
  area_m2: MetrosCuadrados
  color: string
  sistema_riego_override?: SistemaRiego
  configuracion_riego?: ConfiguracionRiego
  estanque_config?: EstanqueConfig
  notas: string
  created_at: Timestamp
  updated_at: Timestamp
  lastModified?: Timestamp
}

export const COLORES_ZONA: Record<TipoZona, string> = {
  cultivo: '#22c55e',
  bodega: '#a16207',
  casa: '#3b82f6',
  camino: '#6b7280',
  decoracion: '#a855f7',
  estanque: '#06b6d4',
  otro: '#374151',
}
```

---

## Planta

```typescript
export type EstadoPlanta = 'plantada' | 'creciendo' | 'produciendo' | 'muerta'
export type EtapaCrecimiento = 'plántula' | 'joven' | 'adulta' | 'madura'

export const ETAPAS_CRECIMIENTO: EtapaCrecimiento[] = ['plántula', 'joven', 'adulta', 'madura']

export const ETAPA_INFO: Record<EtapaCrecimiento, { emoji: string; label: string; kcRango: string }> = {
  'plántula': { emoji: '🌱', label: 'Plántula', kcRango: '0.4-0.5' },
  'joven': { emoji: '🌿', label: 'Joven', kcRango: '0.7-0.8' },
  'adulta': { emoji: '🌳', label: 'Adulta', kcRango: '1.0-1.2' },
  'madura': { emoji: '🍎', label: 'Madura', kcRango: '0.8-0.9' },
}

export interface ConfiguracionGoteros {
  cantidad: number
  caudal_lh_por_gotero: number
}

export const GOTEROS_DEFAULT: ConfiguracionGoteros = {
  cantidad: 2,
  caudal_lh_por_gotero: 4,
}

export interface Planta {
  id: UUID
  zona_id: UUID
  tipo_cultivo_id: UUID
  x: Metros
  y: Metros
  estado: EstadoPlanta
  etapa_actual: EtapaCrecimiento
  fecha_plantacion: Timestamp
  fecha_cambio_etapa?: Timestamp
  goteros?: ConfiguracionGoteros  // existe en schema pero no se usa actualmente
  notas: string
  created_at: Timestamp
  updated_at: Timestamp
  lastModified?: Timestamp
}

export const COLORES_ESTADO_PLANTA: Record<EstadoPlanta, string> = {
  plantada: '#84cc16',
  creciendo: '#22c55e',
  produciendo: '#f59e0b',
  muerta: '#6b7280',
}
```

---

## Catálogo de Cultivos

```typescript
export type Tolerancia = 'alta' | 'media' | 'baja' | 'muy_baja'
export type ToleranciaSimple = 'alta' | 'media' | 'baja'
export type Tier = 1 | 2 | 3
export type Riesgo = 'bajo' | 'medio' | 'alto'
export type ToleranciaHeladas = 'alta' | 'media' | 'baja' | 'nula'
export type ViabilidadProyecto = 'mejor_opcion' | 'recomendado' | 'viable' | 'limitado' | 'no_recomendado' | 'pendiente_calculo'

export interface PlantPlague {
  nombre: string
  nombre_cientifico?: string
  grados_dia_base: number
  grados_dia_ciclo: number
  grados_dia_ovicida_ventana: number
  control_recomendado: string
  temperatura_min?: number
  temperatura_max?: number
  etapas_vulnerables?: EtapaCrecimiento[]
  severidad?: 'baja' | 'media' | 'alta' | 'critica'
  medidas_preventivas?: string[]
}

export interface PlantCalendar {
  meses_siembra: number[]
  meses_cosecha: number[]
  meses_descanso: number[]
}

export interface PlantProduction {
  produccion_kg_ha_año2: number
  produccion_kg_ha_año3: number
  produccion_kg_ha_año4: number
  vida_util_dias: number
}

export interface PlantClima {
  temp_min_c?: number
  temp_max_c?: number
  tolerancia_heladas?: ToleranciaHeladas
  horas_frio_requeridas?: number
}

export interface CatalogoCultivo {
  id: UUID
  proyecto_id: UUID
  nombre: string
  nombre_cientifico?: string

  // Agua
  agua_m3_ha_año_min: MetrosCubicos
  agua_m3_ha_año_max: MetrosCubicos

  // Espaciado
  espaciado_min_m: Metros
  espaciado_recomendado_m: Metros

  // Tolerancias numéricas
  ph_min: number
  ph_max: number
  salinidad_tolerancia_dS_m: number
  boro_tolerancia_ppm: number

  // Tolerancias categóricas
  tolerancia_boro: Tolerancia
  tolerancia_salinidad: ToleranciaSimple

  // Clima
  clima?: PlantClima
  viabilidad_proyecto?: ViabilidadProyecto

  // Calendario y producción
  calendario: PlantCalendar
  produccion: PlantProduction

  // Precios
  precio_kg_min_clp: PesosCLP
  precio_kg_max_clp: PesosCLP
  precio_planta_clp?: PesosCLP

  // Plagas
  plagas: PlantPlague[]

  // Tiempos
  tiempo_produccion_meses: number
  vida_util_años: number

  // Clasificación
  tier: Tier
  riesgo: Riesgo

  // Economía
  costo_variable_kg?: number

  // Fenología (GDD)
  temperatura_base_C?: number
  grados_dia_etapas?: {
    plantula: number
    joven: number
    adulta: number
    madura: number
  }

  notas: string
  notas_arica?: string
  created_at: Timestamp
  updated_at: Timestamp
}
```

---

## Fuente de Agua (datos estáticos)

```typescript
export type TipoFuenteAgua = 'aljibe' | 'pozo' | 'rio' | 'canal' | 'reciclada' | 'otro'

export interface FuenteAgua {
  id: string
  nombre: string
  tipo: TipoFuenteAgua
  salinidad_dS_m?: number
  boro_ppm?: number
  arsenico_mg_l?: number
  ph?: number
  costo_m3_clp?: number
  notas?: string
}

export type CompatibilidadNivel = 'compatible' | 'limitado' | 'no_compatible'

export interface CompatibilidadAguaCultivo {
  cultivo_id: string
  cultivo_nombre: string
  nivel: CompatibilidadNivel
  problemas: string[]
}
```

---

## Entrada de Agua

```typescript
export interface EntradaAgua {
  id: UUID
  terreno_id: UUID
  estanque_id?: UUID
  fecha: Timestamp
  cantidad_m3: MetrosCubicos
  costo_clp?: PesosCLP
  proveedor?: string
  notas: string
  created_at: Timestamp
  updated_at?: Timestamp
  lastModified?: Timestamp
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
  updated_at?: Timestamp
  lastModified?: Timestamp
}
```

---

## Alertas

```typescript
export type TipoAlerta =
  | 'deficit_agua'
  | 'agua_critica'
  | 'replanta_pendiente'
  | 'lavado_salino'
  | 'riesgo_encharcamiento'
  | 'espaciado_incorrecto'
  | 'zona_sin_cultivo'
  | 'planta_muerta'
  | 'cosecha_pendiente'
  | 'mantenimiento'
  | 'estanque_sin_fuente'
  | 'zona_sin_riego'

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
  lastModified?: Timestamp
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
export type SyncEstado = 'pendiente' | 'sincronizando' | 'error' | 'conflicto'
export type SyncEntidad = 'proyecto' | 'terreno' | 'zona' | 'planta' | 'entrada_agua' | 'cosecha' | 'alerta'
export type SyncAccion = 'create' | 'update' | 'delete'

export interface SyncItem {
  id: UUID
  entidad: SyncEntidad
  entidad_id: UUID
  accion: SyncAccion
  datos: Record<string, unknown>
  datos_servidor?: Record<string, unknown>
  estado: SyncEstado
  error?: string
  intentos: number
  nextRetryAt?: Timestamp
  resuelto_por?: 'local' | 'servidor'
  created_at: Timestamp
  updated_at: Timestamp
}

export interface SyncMeta {
  key: string
  value: string
}

export interface SyncConflict {
  item: SyncItem
  localData: Record<string, unknown>
  serverData: Record<string, unknown>
}

export const SYNC_ENTIDADES: SyncEntidad[] = [
  'proyecto', 'terreno', 'zona', 'planta', 'entrada_agua', 'cosecha', 'alerta',
]

export const RETRY_DELAYS = [1000, 5000, 30000, 120000, 300000]
export const MAX_RETRY_ATTEMPTS = 5
export const SYNC_CLEANUP_DAYS = 7
```

---

## Dashboard Métricas

```typescript
export type Temporada = 'verano' | 'otoño' | 'invierno' | 'primavera'
export type EstadoAgua = 'ok' | 'ajustado' | 'deficit'

export const FACTORES_TEMPORADA: Record<Temporada, number> = {
  verano: 1.4,
  otoño: 1.0,
  invierno: 0.6,
  primavera: 1.2,
}

export interface DashboardTerreno {
  terreno_id: UUID
  area_total_m2: MetrosCuadrados
  area_usada_m2: MetrosCuadrados
  area_libre_m2: MetrosCuadrados
  porcentaje_uso: number
  agua_disponible_m3: MetrosCubicos
  agua_necesaria_m3: MetrosCubicos
  agua_margen_m3: MetrosCubicos
  estado_agua: EstadoAgua
  dias_agua_restantes: number
  total_plantas: number
  plantas_por_cultivo: Record<string, number>
  plantas_produciendo: number
  plantas_muertas: number
  alertas_activas: number
  alertas_criticas: number
  temporada_actual: Temporada
  factor_temporada: number
}
```

---

## Configuración Dexie (IndexedDB)

```typescript
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
  sync_meta!: Table<SyncMeta>

  constructor() {
    super('AgriPlanDB')

    // v1: Schema inicial
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

    // v2: lastModified para sync + sync_meta + compound index
    this.version(2).stores({
      usuarios: 'id, email',
      proyectos: 'id, usuario_id, nombre, lastModified',
      terrenos: 'id, proyecto_id, nombre, lastModified',
      zonas: 'id, terreno_id, tipo, nombre, lastModified',
      plantas: 'id, zona_id, tipo_cultivo_id, estado, lastModified',
      catalogo_cultivos: 'id, proyecto_id, nombre, tier',
      entradas_agua: 'id, terreno_id, fecha, lastModified',
      cosechas: 'id, zona_id, tipo_cultivo_id, fecha, lastModified',
      alertas: 'id, terreno_id, tipo, estado, severidad, lastModified',
      historial: 'id, usuario_id, terreno_id, tipo_accion, created_at',
      sync_queue: 'id, entidad, entidad_id, estado, created_at, nextRetryAt, [entidad+entidad_id]',
      sync_meta: 'key',
    })
  }
}
```
