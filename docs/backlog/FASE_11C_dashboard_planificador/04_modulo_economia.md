# 04: Módulo Economía (Costos/Ganancias/ROI)

**Status**: ✅ COMPLETADO
**Prioridad**: 🔴 CRÍTICA
**Estimación**: 4-5 días
**Dependencias**: 01_dashboard

---

## 🎯 Objetivo

Responder: **"¿Me conviene económicamente este cultivo?"**

---

## 📋 Cálculos

```
Ingresos = plantas × kg/planta/año × precio/kg
Costos = agua + semillas + mano_obra + herramientas
Neto = Ingresos - Costos
ROI = (Neto / Costos) × 100%
```

---

## 🏗️ Implementación

### Nueva Página: `/economia`

```
┌─────────────────────────────────┐
│ 💰 Economía del Cultivo         │
├─────────────────────────────────┤
│ Cultivo         Ingreso  Neto   │
│ 10 Tomates      $900    $700    │
│ 5 Mangos        $1,500  $1,200  │
│ 5 Zanahorias    $200    $150    │
│ ──────────────────────────────  │
│ TOTAL           $2,600  $2,050  │
│                                 │
│ ROI: 187%                       │
│ Tiempo recuperación: 6 meses    │
└─────────────────────────────────┘
```

### Datos Necesarios

```typescript
interface EconomiaCultivo {
  rendimiento_kg_año: number; // Pre-cargado
  precio_venta_kg: number; // Usuario ingresa
  costo_semilla: number; // Pre-cargado
  costo_agua_m3: number; // Usuario ingresa
  costo_mano_obra?: number; // Usuario ingresa
}
```

---

## ✅ Criterios

- [ ] Tabla ingresos/costos por cultivo
- [ ] Total consolidado
- [ ] ROI calculado
- [ ] Comparador "¿Qué pasa si agrego X plantas?"

---

**Siguiente**: `05_alertas_criticas.md`
