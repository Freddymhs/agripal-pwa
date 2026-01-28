# Futuro: Calendario de Tareas

**Prioridad:** Post-MVP
**Dependencias:** Sprint 1-4 completos

---

## 🎯 Objetivo

Implementar calendario con tareas agrícolas: riego, fertilización, poda, cosecha.

---

## 📋 Funcionalidades

- Vista mensual de tareas
- Tareas automáticas basadas en cultivo
- Tareas manuales del usuario
- Recordatorios/notificaciones
- Exportar a iCal

---

## 📋 Tipos de Tareas

| Tipo | Fuente | Frecuencia |
|------|--------|------------|
| Riego | Automático | Según config sistema |
| Fertilización | Catálogo cultivo | Mensual/trimestral |
| Control plagas | Grados-día | Variable |
| Poda | Catálogo cultivo | Anual |
| Cosecha | Catálogo cultivo | Estacional |
| Revisión trampas | SAG | Semanal |
| Mantenimiento | Usuario | Variable |

---

## 📄 Modelo de Datos

```typescript
interface Tarea {
  id: UUID;
  terreno_id: UUID;
  zona_id?: UUID;

  tipo: 'riego' | 'fertilizacion' | 'poda' | 'cosecha' | 'plaga' | 'mantenimiento' | 'otro';
  titulo: string;
  descripcion: string;

  fecha_programada: Timestamp;
  fecha_completada?: Timestamp;

  recurrente: boolean;
  frecuencia?: 'diario' | 'semanal' | 'mensual' | 'anual';

  prioridad: 'alta' | 'media' | 'baja';
  estado: 'pendiente' | 'completada' | 'omitida';

  notas: string;
  created_at: Timestamp;
}
```

---

## ✅ Criterios de Éxito

- [ ] Vista calendario funcional
- [ ] Tareas generadas automáticamente
- [ ] Usuario puede agregar/editar tareas
- [ ] Notificaciones de recordatorio
- [ ] Historial de tareas completadas
