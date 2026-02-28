# Futuro: Historial de Cambios

**Prioridad:** Post-MVP
**Dependencias:** Ninguna bloqueante
**Feedback relacionado:** Ninguno directo

---

## Estado Actual del Codebase

**Modelo YA existe** en `src/types/index.ts` (linea ~521):

```typescript
export interface HistorialEntrada {
  id: string;
  usuario_id: string;
  accion: string;
  entidad: string;
  entidad_id: string;
  datos_anterior?: Record<string, unknown>;
  datos_nuevo?: Record<string, unknown>;
  created_at: string;
}
```

**Tabla YA existe** en IndexedDB (`src/lib/db/index.ts`, linea 27):

```
historial: '++id, usuario_id, entidad, created_at, lastModified'
```

**Falta:** Solo la UI (pagina `/historial`, vista cronologica, filtros, busqueda).

---

## Funcionalidades Pendientes (solo UI)

- [ ] Pagina `/historial` con lista cronologica
- [ ] Filtrar por: fecha, tipo accion, terreno, zona
- [ ] Buscar en descripciones
- [ ] Ver detalles de cada cambio (diff datos_anterior vs datos_nuevo)
- [ ] Agrupar por dia

## Funcionalidades Post-Supabase

- [ ] Exportar historial a PDF/CSV
- [ ] Historial compartido entre usuarios del mismo proyecto
