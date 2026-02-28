# Futuro: Registro de Cosechas

**Prioridad:** Post-MVP
**Dependencias:** FASE_12 (Supabase) para fotos/exportar
**Feedback relacionado:** FEAT-F07 (reportes/exportar)

---

## Estado Actual del Codebase

**Modelo YA existe** en `src/types/index.ts` (linea ~451):

```typescript
export interface Cosecha {
  id: string;
  zona_id: string;
  cultivo_id: string;
  fecha: string;
  cantidad_kg: number;
  calidad: "A" | "B" | "C";
  precio_venta_clp?: number;
  destino?: string;
  notas?: string;
  created_at: string;
  updated_at: string;
}
```

**Tabla YA existe** en IndexedDB (`src/lib/db/index.ts`, linea 28):

```
cosechas: '++id, zona_id, cultivo_id, fecha, lastModified'
```

**Falta:** Solo la UI (pagina `/cosechas`, formulario registro, historial, graficos).

---

## Funcionalidades Pendientes (solo UI)

- [ ] Pagina `/cosechas` con formulario de registro
- [ ] Campos: fecha, cantidad (kg), calidad (A/B/C), destino, precio
- [ ] Historial de cosechas por zona con filtros
- [ ] Graficos de produccion (kg/mes, kg/zona)
- [ ] Comparar cosecha real vs proyeccion ROI (`calcularROI()` en `roi.ts`)

## Funcionalidades Post-Supabase

- [ ] Adjuntar fotos (requiere storage)
- [ ] Exportar reportes PDF/CSV

---

## Metricas a Calcular

- kg/m2 por zona
- kg/planta promedio
- Ingresos totales vs proyectados
- Precio promedio por kg
- Comparacion entre temporadas
