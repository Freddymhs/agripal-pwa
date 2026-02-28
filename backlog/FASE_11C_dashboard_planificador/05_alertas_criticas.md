# 05: Alertas Críticas (Agua/Replantas/Lavado)

**Status**: ✅ COMPLETADO
**Prioridad**: 🔴 CRÍTICA
**Estimación**: 3-4 días
**Dependencias**: 01_dashboard, 02_etapas

---

## 🎯 Objetivo

Sistema de **alertas automáticas** que previenen desastres.

---

## 📋 Tipos de Alertas

### 1. Agua Crítica

```
⚠️ CRÍTICO: Agua solo para 3 días
Próxima recarga: 10 Feb (7 días)
Acción: Adelanta recarga 4 días
```

### 2. Replantas Programadas

```
🔔 Recordatorio: Tomates deben replantarse
Plantados: 15 Dic 2025 (240 días atrás)
Acción: Replanta en próximos 14 días
```

### 3. Lavado Salino

```
🧼 Mantenimiento: Lavado salino pendiente
Última limpieza: 1 Ene (35 días atrás)
Acción: Riega 20% extra para lixiviar sales
```

### 4. Riesgo Encharcamiento

```
⚠️ Riesgo: Suelo arcilloso + riego 24/7
Acción: Cambia a riego programado 6h/día
```

---

## 🏗️ Implementación

```typescript
interface Alerta {
  id: UUID;
  tipo: "agua_critica" | "replanta" | "lavado_salino" | "encharcamiento";
  prioridad: "alta" | "media" | "baja";
  mensaje: string;
  accion_recomendada: string;
  fecha_generada: Timestamp;
  fecha_vencimiento?: Timestamp;
  resuelta: boolean;
}
```

Hook `useAlertas()` genera alertas automáticamente cada 6 horas.

---

## ✅ Criterios

- [ ] Alerta agua < 7 días
- [ ] Alerta replanta según ciclo cultivo
- [ ] Alerta lavado cada 30 días
- [ ] Alerta encharcamiento si riego continuo + arcilloso
- [ ] Banner prominente en dashboard
- [ ] Notificación push (futuro PWA)

---

**Siguiente**: `06_planificador_largo_plazo.md`
