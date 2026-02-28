# Futuro: Calendario de Tareas

**Prioridad:** Post-MVP (Tier 5)
**Dependencias:** Datos de cultivo + alertas existentes
**Feedback relacionado:** IDEA-02 (calendario Gantt)

---

## Estado Actual del Codebase

**Ya existe parcialmente:**

- `src/lib/utils/alertas.ts` genera alertas automaticas (agua_critica, replanta_pendiente, lavado_salino, riesgo_encharcamiento)
- `src/lib/data/duracion-etapas.ts` tiene datos de etapas de crecimiento por cultivo
- `/agua/planificador` tiene proyeccion 12 meses con eventos (recargas, replantas, lavado, cosechas)
- CatalogoCultivo tiene `calendario.meses_siembra[]` y `calendario.meses_cosecha[]`

**Falta:**

- Vista calendario visual (Gantt o mensual)
- Tareas manuales del usuario (crear/editar/completar)
- Modelo `Tarea` en IndexedDB
- Notificaciones/recordatorios

---

## Funcionalidades Pendientes

### Fase 1: Vista calendario (sobre datos existentes)

- [ ] Vista mensual que muestre alertas existentes como eventos
- [ ] Integrar datos de `agua-proyeccion-anual.ts` (recargas, cosechas)
- [ ] Mostrar meses siembra/cosecha del catalogo

### Fase 2: Tareas manuales

- [ ] Modelo `Tarea` en types + Dexie
- [ ] CRUD de tareas manuales
- [ ] Marcar como completada/omitida
- [ ] Tareas recurrentes

### Fase 3: Notificaciones

- [ ] Push notifications (requiere Service Worker, ya existe via PWA)
- [ ] Exportar a iCal

---

## Modelo de Datos Propuesto

```typescript
interface Tarea {
  id: string;
  terreno_id: string;
  zona_id?: string;
  tipo:
    | "riego"
    | "fertilizacion"
    | "poda"
    | "cosecha"
    | "plaga"
    | "mantenimiento"
    | "otro";
  titulo: string;
  descripcion: string;
  fecha_programada: string;
  fecha_completada?: string;
  recurrente: boolean;
  frecuencia?: "diario" | "semanal" | "mensual" | "anual";
  prioridad: "alta" | "media" | "baja";
  estado: "pendiente" | "completada" | "omitida";
  notas?: string;
  created_at: string;
}
```
