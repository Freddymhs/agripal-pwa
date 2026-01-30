# FASE 11C: Dashboard Mejorado + Planificador Económico

**Status**: ✅ COMPLETADO
**Prioridad**: 🔴 CRÍTICA
**Dependencias**: FASE_11B
**Estimación**: 6-8 semanas
**Objetivo**: Transformar dashboard en herramienta día a día + agregar planificador largo plazo

---

## 🎯 Visión General

Esta fase divide la aplicación en **DOS contextos claramente separados**:

### 1. 💧 **Dashboard Día a Día** (Pantalla Principal)
**Usuario objetivo**: Agricultor operando su cultivo diariamente

**Pregunta central**: *"¿Me alcanza el agua para las próximas 2 semanas?"*

**Características**:
- ✅ **Simple y directo**: Sin gráficos complejos, solo resultado final
- ✅ **Tiempo real**: Agrega/quita plantas → recalcula automáticamente
- ✅ **Basado en realidad**: SOLO plantas actuales plantadas
- ✅ **Alertas claras**: "Agua solo para 3 días" (verde/amarillo/rojo)
- ✅ **Configuración rápida**: Estanque + recarga cada X días
- ✅ **Sistema riego**: 24/7 continuo O programado con válvulas
- ✅ **Etapas automáticas**: Plántula → Joven → Adulta → Madura (afecta consumo)

**Cálculos automáticos** (por dentro, invisibles):
```
Consumo/planta/día = goteros × L/h/gotero × horas_riego × Kc_etapa × factor_suelo
Total/día = suma(todas_plantas)
Días_restantes = agua_actual / consumo_diario
```

**Interfaz**:
```
┌─────────────────────────────────────┐
│ 🌱 Dashboard Agua                   │
├─────────────────────────────────────┤
│ Estanque: 60% (3,000 L)             │
│ █████████░░░ AMARILLO               │
│                                     │
│ Consumo hoy: 400 L/día              │
│ Alcanza para: 7.5 días ⚠️           │
│                                     │
│ Próxima recarga: 10 Feb (3 días)    │
│ ❌ NO ALCANZA (falta 1 día)         │
│                                     │
│ Plantas activas: 20                 │
│ - 10 Tomates (Adultos) → 250 L/día  │
│ - 5 Mangos (Jóvenes) → 100 L/día    │
│ - 5 Zanahorias (Plántulas) → 50 L/d │
│                                     │
│ [Ver Planificador Largo Plazo →]   │
└─────────────────────────────────────┘
```

---

### 2. 📊 **Planificador Largo Plazo** (Pantalla Separada)
**Usuario objetivo**: Agricultor experto planificando inversión

**Pregunta central**: *"¿Es viable económicamente este cultivo a 12 meses?"*

**Características**:
- ✅ **Proyección 12 meses**: Gráfico agua vs tiempo
- ✅ **Calendario recargas**: Configurable (cada X días, Y litros)
- ✅ **Economía completa**: Ingresos - Costos = Ganancia
- ✅ **Etapas temporales**: Considera cambio Kc en el tiempo
- ✅ **Lavado salino**: Auto-programa cada X días
- ✅ **Replantas**: Alerta "Tomates: replanta mayo"
- ✅ **Escenarios**: "¿Qué pasa si agrego 5 mangos?"
- ✅ **Vista CEO**: Excel con todas las métricas

**Cálculos avanzados**:
```
Proyección_mes = for each mes {
  consumo_mes = plantas × Kc_etapa_mes × días_mes × factor_clima_mes
  recargas_mes = frecuencia × cantidad
  nivel_final = nivel_inicial + recargas_mes - consumo_mes
  alerta = nivel_final < 0 ? "CRÍTICO" : "OK"
}

Economía = {
  ingresos = plantas × kg/planta × precio/kg
  costos = agua + semillas + mano_obra + herramientas
  neto = ingresos - costos
  ROI = (neto / costos) × 100
}
```

**Interfaz**:
```
┌─────────────────────────────────────┐
│ 📊 Planificador 12 Meses            │
├─────────────────────────────────────┤
│ Configuración:                      │
│ • Recarga cada: [14] días           │
│ • Cantidad: [5000] L                │
│ • Costo agua: [$50] / m³            │
│                                     │
│ [Gráfico línea: Nivel estanque]    │
│ 5000L ┼─╮                           │
│       │  ╲  recarga  recarga        │
│       │   ╲   ╱╲      ╱╲            │
│    0L └────╲─╱──╲────╱──╲───        │
│        Ene Feb Mar Abr May Jun      │
│                                     │
│ Alertas:                            │
│ • ⚠️ Abril: Agua crítica (día 15)   │
│ • 🔔 Mayo: Replanta tomates         │
│ • 🧼 Marzo: Lavado salino           │
│                                     │
│ Economía Proyectada:                │
│ • Ingresos año: $1,200              │
│ • Costos año: $450                  │
│ • Ganancia neta: $750               │
│ • ROI: 166%                         │
│                                     │
│ [← Volver a Dashboard]              │
└─────────────────────────────────────┘
```

---

## 📋 Sub-Fases (Tareas)

### 🔴 ALTA Prioridad (Completar primero)

| # | Archivo | Descripción | Estimación | Dep | Status |
|---|---------|-------------|------------|-----|--------|
| **01** | `01_dashboard_agua_dia_a_dia.md` | Dashboard simple 2 semanas | 1 semana | - | ✅ |
| **02** | `02_etapas_crecimiento_kc.md` | Etapas automáticas + Kc variable | 4-5 días | 01 | ✅ |
| **03** | `03_sistema_riego_goteros.md` | Goteros configurable + 24/7 vs Programado | 5-6 días | 01 | ✅ |
| **04** | `04_modulo_economia.md` | Costos + Ingresos + ROI | 4-5 días | 01 | ✅ |
| **05** | `05_alertas_criticas.md` | Agua/Replantas/Lavado | 3-4 días | 01,02,03 | ✅ |

### 🟡 MEDIA Prioridad (Después de ALTA)

| # | Archivo | Descripción | Estimación | Dep | Status |
|---|---------|-------------|------------|-----|--------|
| **06** | `06_planificador_largo_plazo.md` | Proyección 12 meses + Economía | 1.5 semanas | 01-05 | ✅ |

### 🟢 BAJA Prioridad (Integración final)

| # | Archivo | Descripción | Estimación | Dep | Status |
|---|---------|-------------|------------|-----|--------|
| **07** | `07_integracion_final.md` | Conectar todo + Tests | 3-4 días | 01-06 | ✅ |
| **08** | `08_suelo_integration.md` | Integrar /suelo a navegación + Score | 1 día | 01-07 | ✅ |

---

## 🏗️ Arquitectura de Datos

### Nuevos Tipos (Agregar a `src/types/index.ts`)

```typescript
// Etapas de crecimiento
export enum EtapaCrecimiento {
  PLANTULA = 'plántula',    // Kc 0.4-0.5
  JOVEN = 'joven',          // Kc 0.7-0.8
  ADULTA = 'adulta',        // Kc 1.0-1.2 (pico)
  MADURA = 'madura',        // Kc 0.8-0.9
}

// Configuración de riego
export interface ConfiguracionRiego {
  tipo: 'continuo_24_7' | 'programado'
  // Si programado:
  horas_dia?: number          // ej: 6h/día
  horario_inicio?: string     // ej: "06:00"
  horario_fin?: string        // ej: "12:00"
}

// Goteros por planta
export interface ConfiguracionGoteros {
  cantidad: number            // ej: 2 goteros
  caudal_lh: number          // ej: 4 L/h por gotero
}

// Planta extendida
export interface Planta {
  // ... campos existentes
  etapa_actual: EtapaCrecimiento
  fecha_plantacion: Timestamp
  goteros?: ConfiguracionGoteros
}

// Economía cultivo
export interface EconomiaCultivo {
  cultivo_id: UUID
  rendimiento_kg_año: number
  precio_venta_kg: number
  costo_semilla: number
  costo_mano_obra?: number
  costo_herramientas?: number
  costo_agua_m3: number
}

// Proyección mensual
export interface ProyeccionMensual {
  mes: number                 // 1-12
  año: number
  consumo_agua_m3: number
  recargas_programadas: number
  nivel_estanque_inicio: number
  nivel_estanque_fin: number
  alertas: string[]
  costo_agua: number
}

// Calendario recargas
export interface CalendarioRecargas {
  frecuencia_dias: number     // ej: 14 días
  cantidad_litros: number     // ej: 5000 L
  costo_por_recarga: number   // ej: $50
  proxima_recarga: Timestamp
}
```

---

## 🎨 Navegación Propuesta

```
/ (Mapa principal)
├── Header
│   ├── Dashboard Agua 💧 (principal)
│   └── Planificador 📊 (avanzado)
│
/agua (Dashboard día a día)
├── Resumen agua (nivel, días, alertas)
├── Plantas activas (consumo por tipo)
├── Configuración rápida (recarga, goteros)
└── [Ver Planificador →]

/agua/planificador (Largo plazo)
├── Gráfico 12 meses
├── Calendario recargas
├── Economía proyectada
├── Alertas futuras (replantas, lavado)
└── [← Volver Dashboard]

/economia (Módulo separado o integrado?)
├── Ingresos por cultivo
├── Costos detallados
├── ROI comparativo
└── Proyección anual
```

---

## 🔧 Tecnologías y Librerías

### Existentes (Reutilizar)
- ✅ IndexedDB (Dexie.js) - Persistencia
- ✅ SWR - Estado
- ✅ TailwindCSS - Estilos
- ✅ Hooks existentes (useAgua, useEstanques, etc.)

### Nuevas (Agregar)
- 📈 **Recharts** o **Chart.js** - Gráficos proyección temporal
- 📅 **date-fns** - Manipulación fechas (calendarios, etapas)
- 🧮 **decimal.js** - Precisión cálculos económicos

```bash
pnpm add recharts date-fns decimal.js
pnpm add -D @types/recharts
```

---

## ⚠️ Principios de Diseño

### 1. **Datos Estáticos Ahora, API Futura**
Toda la información (clima, cultivos, Kc) viene de archivos estáticos JSON/TS. Arquitectura preparada para API futura sin cambiar lógica.

```typescript
// Ahora:
const clima = await getClimaEstatico(terreno.region)

// Futuro (mismo input/output):
const clima = await getClimaAPI(terreno.coordenadas)
```

### 2. **Simplicidad en UI, Complejidad por Dentro**
Usuario ve: "Alcanza para 7 días ⚠️"
Sistema calcula: `∑(plantas × goteros × caudal × horas × Kc × factor_suelo × factor_clima)`

### 3. **Reutilizar Código Existente**
NO rehacer funcionalidades que funcionan. Extender, no reemplazar.

### 4. **Backlog = Verdad Absoluta**
Todo cambio, funcionalidad, decisión DEBE estar documentado aquí.

---

## 📊 Métricas de Éxito

- [ ] Dashboard responde en <500ms al agregar/quitar planta
- [ ] Cálculo agua preciso vs realidad usuario (±5%)
- [ ] Usuario entiende "¿alcanza agua?" en <10 segundos
- [ ] Planificador proyecta 12 meses sin errores
- [ ] Economía ROI ayuda decisión inversión (feedback usuarios)
- [ ] Alertas críticas reducen emergencias agua (métrica futura)

---

## 🚀 Orden de Implementación

### **Iteración 1: Dashboard Funcional** (Semanas 1-2)
- 01_dashboard_agua_dia_a_dia.md
- 02_etapas_crecimiento_kc.md
- 03_sistema_riego_goteros.md

**Checkpoint**: Usuario puede operar día a día con precisión

### **Iteración 2: Inteligencia** (Semanas 3-4)
- 04_modulo_economia.md
- 05_alertas_criticas.md

**Checkpoint**: Usuario toma decisiones informadas (plantar/no plantar)

### **Iteración 3: Planificación Avanzada** (Semanas 5-7)
- 06_planificador_largo_plazo.md
- 07_integracion_final.md

**Checkpoint**: Usuario experto proyecta negocio agrícola completo

---

## 🔗 Dependencias con Otras Fases

| Fase | Relación | Impacto |
|------|----------|---------|
| FASE_8 (Agua) | Reutiliza hooks useAgua | Extender, no reemplazar |
| FASE_6 (Recomendación) | Usa cálculo Kc | Integrar etapas |
| FASE_10C (Datos Agrícolas) | Usa cultivos pre-cargados | Agregar Kc por etapa |
| FASE_12-14 (SaaS) | Independiente | No bloquea conversión |

---

## 📝 Notas Importantes

1. **NO complicar dashboard principal**: Debe ser tan simple que agricultor sin experiencia técnica entienda en segundos
2. **Planificador es opcional**: Usuario puede nunca usarlo si solo necesita día a día
3. **Económico = Decisión crítica**: "¿Me conviene plantar más?" debe tener respuesta clara
4. **Alertas salvan cosechas**: Agua crítica, replantas, lavado salino → prevenir desastres
5. **Etapas automáticas**: Usuario NO ingresa Kc manualmente, solo ve "Plántula/Joven/Adulta"

---

## 🎯 Próximo Paso

**Leer**: `01_dashboard_agua_dia_a_dia.md` para empezar implementación.
