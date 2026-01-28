# Futuro: Registro de Cosechas

**Prioridad:** Post-MVP
**Dependencias:** Sprint 1-4 completos

---

## 🎯 Objetivo

Registrar cosechas con cantidad, calidad, destino y precio de venta.

---

## 📋 Funcionalidades

- Registrar cosecha por zona
- Campos: fecha, cantidad (kg), calidad (A/B/C), destino, precio
- Adjuntar fotos
- Historial de cosechas
- Gráficos de producción
- Comparar vs proyección

---

## 📄 Modelo de Datos

```typescript
interface Cosecha {
  id: UUID;
  zona_id: UUID;
  tipo_cultivo_id: UUID;

  fecha: Timestamp;
  cantidad_kg: Kilogramos;
  calidad: 'A' | 'B' | 'C';

  vendido: boolean;
  precio_venta_clp?: PesosCLP;
  destino?: string;

  foto_url?: string;
  notas: string;

  created_at: Timestamp;
}
```

---

## 📋 Métricas a Calcular

- kg/m² por zona
- kg/planta promedio
- Ingresos totales
- Precio promedio por kg
- Comparación entre temporadas

---

## ✅ Criterios de Éxito

- [ ] Formulario de registro funcional
- [ ] Historial con filtros
- [ ] Gráficos de producción
- [ ] Fotos adjuntas
- [ ] Exportar reportes
