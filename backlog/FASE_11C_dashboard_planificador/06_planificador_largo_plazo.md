# 06: Planificador Largo Plazo (12 Meses)

**Status**: ✅ COMPLETADO
**Prioridad**: 🟡 MEDIA
**Estimación**: 1.5 semanas
**Dependencias**: 01-05 completados

---

## 🎯 Objetivo

Vista **CEO** para proyectar negocio agrícola completo:
- Proyección agua 12 meses
- Calendario recargas
- Economía anual
- Alertas futuras (replantas, lavado)

---

## 📋 Funcionalidades

### 1. Gráfico Nivel Estanque
```
5000L ┼─╮
      │  ╲  ╱╲    ╱╲    ╱╲
      │   ╲╱  ╲  ╱  ╲  ╱  ╲
   0L └─────╲──╲╱────╲╱────╲
       Ene Feb Mar Abr May Jun
```

### 2. Calendario Recargas
- Usuario configura: cada X días, Y litros
- Sistema proyecta 12 meses
- Marca alertas si agua < 0

### 3. Economía Proyectada
```
Ingresos año: $12,000
Costos año: $4,500
Neto: $7,500
ROI: 166%
```

### 4. Eventos Futuros
- Replantas: "Mayo - Tomates"
- Lavado: "Cada 30 días"
- Cosechas: "Agosto - Mangos"

---

## 🏗️ Nueva Página `/agua/planificador`

Reutiliza plantas actuales, proyecta a futuro.

---

## ✅ Criterios

- [ ] Gráfico 12 meses funcional
- [ ] Calendario recargas configurable
- [ ] Economía anual calculada
- [ ] Alertas futuras visibles
- [ ] Escenario "Agregar X plantas"

---

**Siguiente**: `07_integracion_final.md`
