# 03: Sistema Riego con Goteros Configurables

**Status**: ✅ COMPLETADO
**Prioridad**: 🔴 CRÍTICA
**Estimación**: 5-6 días
**Dependencias**: 01_dashboard, 02_etapas

---

## 🎯 Objetivo

Implementar **dos tipos de riego** con goteros configurables por planta.

---

## 📋 Tipos de Sistema

### 1. Continuo 24/7 (Manual)
- Válvula abierta permanentemente
- Caudal constante L/h
- Cálculo: `gasto_día = caudal_lh × 24`
- ⚠️ Riesgo: Encharcamiento (especialmente suelo arcilloso)

### 2. Programado (Electrónico)
- Válvulas automáticas con timer
- Horario específico (ej: 6am-12pm = 6h/día)
- Cálculo: `gasto_día = caudal_lh × horas_dia`
- ✅ Ahorro: 50-75% agua vs continuo

---

## 🏗️ Implementación

### Tarea 3.1: Tipos Sistema Riego

**Archivo**: `src/types/index.ts`

```typescript
export interface ConfiguracionRiego {
  tipo: 'continuo_24_7' | 'programado'
  
  // Común
  caudal_total_lh: number        // L/h total del sistema
  
  // Solo si programado
  horas_dia?: number              // ej: 6h
  horario_inicio?: string         // ej: "06:00"
  horario_fin?: string            // ej: "12:00"
}

export interface ConfiguracionGoteros {
  cantidad: number                // ej: 2 goteros
  caudal_lh_por_gotero: number   // ej: 4 L/h
}

export interface Planta {
  // ... existentes
  goteros?: ConfiguracionGoteros
}
```

### Tarea 3.2: Componente Configurar Riego

**Archivo**: `src/components/agua/configurar-riego-modal.tsx`

Modal para configurar sistema de riego global (por estanque/zona):

- Selector tipo: Continuo vs Programado
- Si continuo: Solo caudal total
- Si programado: Caudal + horario + horas/día
- Preview: "Gasto estimado: X L/día"
- Alerta si suelo arcilloso + continuo

### Tarea 3.3: Componente Configurar Goteros Planta

Botón "⚙️ Goteros" en PlantaInfo:

- Cantidad goteros (1-4)
- Caudal L/h por gotero (2-8 L/h)
- Preview consumo: "2 goteros × 4 L/h × 6h = 48 L/día"

### Tarea 3.4: Actualizar Cálculo Consumo

```typescript
function calcularConsumoPlanta(
  planta: Planta,
  cultivo: CatalogoCultivo,
  configRiego: ConfiguracionRiego,
  kc: number
): number {
  // Goteros configurados
  const goteros = planta.goteros || {
    cantidad: 2,  // default
    caudal_lh_por_gotero: 4,
  }

  // Horas riego
  const horasRiego = configRiego.tipo === 'continuo_24_7'
    ? 24
    : (configRiego.horas_dia || 6)

  // Consumo real
  const consumoDiario =
    goteros.cantidad *
    goteros.caudal_lh_por_gotero *
    horasRiego *
    kc

  return consumoDiario
}
```

---

## ✅ Criterios Aceptación

- [ ] Usuario elige sistema: Continuo O Programado
- [ ] Si programado: configura horario/horas
- [ ] Usuario configura goteros por planta
- [ ] Cálculo consumo usa goteros reales
- [ ] Alerta si continuo + suelo arcilloso
- [ ] Preview consumo en tiempo real

---

## 🎯 Ejemplo

**Sistema**: Programado 6h/día (6am-12pm)
**Planta Tomate**: 2 goteros × 4 L/h

```
Consumo = 2 × 4 × 6 × kc(0.75) = 36 L/día
```

**vs Continuo 24/7**:
```
Consumo = 2 × 4 × 24 × kc(0.75) = 144 L/día (4x más!)
```

---

**Siguiente**: `04_modulo_economia.md`
