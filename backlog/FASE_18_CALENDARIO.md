# FASE 18: Calendario de Eventos (Vista Mensual)

**Status**: ⏳ PENDIENTE
**Prioridad**: 🟢 BAJA-MEDIA
**Dependencias**: FASE_16 (Cosechas), FASE_12 (para alertas en sync)
**Estimación**: 2-3 horas
**Última revisión**: 2026-03-01

---

## Decisión de alcance

**Alcance elegido: solo vista mensual con eventos existentes.** Sin tareas manuales por ahora.

La ganancia es consolidar en un solo lugar, por fecha, todo lo que ya calcula la app:

- Alertas activas (de `/alertas`)
- Eventos proyectados del agua (recargas, lavados, replantas, cosechas de `/agua/planificador`)
- Meses de siembra/cosecha del catálogo
- Cosechas registradas reales (de FASE_16)

El usuario no necesita aprender nada nuevo — ve en formato calendario lo que ya sabe.

---

## Estado Real del Código (auditado 2026-03-01)

| Fuente de eventos                                           | Estado          |
| ----------------------------------------------------------- | --------------- |
| `src/lib/utils/alertas.ts` — alertas automáticas            | ✅ Existe       |
| `src/lib/utils/agua-proyeccion-anual.ts` — eventos 12 meses | ✅ Existe       |
| `CatalogoCultivo.calendario.meses_siembra[]`                | ✅ Existe       |
| `CatalogoCultivo.calendario.meses_cosecha[]`                | ✅ Existe       |
| Cosechas reales registradas                                 | ✅ Tras FASE_16 |
| Página `/calendario`                                        | ❌ NO existe    |

---

## Objetivo

Vista mensual que muestre en un solo lugar todos los eventos relevantes del terreno activo, con navegación entre meses.

---

## Funcionalidades

### Vista mensual

- Grid de días del mes actual
- Navegar al mes anterior/siguiente
- Cada día muestra chips de colores por tipo de evento:
  - 🔴 Alertas críticas (agua_critica, riesgo_encharcamiento)
  - 🟡 Alertas de advertencia (replanta_pendiente, lavado_salino)
  - 🔵 Eventos de agua proyectados (recarga, lavado, cosecha planificada)
  - 🟢 Meses de siembra/cosecha del catálogo
  - ⚫ Cosechas registradas reales

### Panel de detalle

- Click en un día → lista de eventos de ese día
- Cada evento muestra: tipo, zona afectada, descripción, acción sugerida

### Resumen del mes

- Contador de alertas activas
- Próximos 3 eventos más urgentes

---

## Archivos a crear

| Archivo                                              | Descripción                                                   |
| ---------------------------------------------------- | ------------------------------------------------------------- |
| `src/app/calendario/page.tsx`                        | Página principal                                              |
| `src/app/calendario/error.tsx`                       | Error boundary                                                |
| `src/components/calendario/calendar-grid.tsx`        | Grid mensual                                                  |
| `src/components/calendario/calendar-day.tsx`         | Celda de día con chips                                        |
| `src/components/calendario/calendar-event-panel.tsx` | Panel lateral de detalle                                      |
| `src/lib/utils/calendario-eventos.ts`                | Función que unifica todas las fuentes en `EventoCalendario[]` |
| `src/lib/constants/routes.ts`                        | Agregar `ROUTES.CALENDARIO = "/calendario"`                   |

---

## Tipo `EventoCalendario`

```typescript
interface EventoCalendario {
  id: string;
  fecha: string; // ISO date YYYY-MM-DD
  tipo:
    | "alerta_critica"
    | "alerta_advertencia"
    | "agua_evento"
    | "siembra"
    | "cosecha_planificada"
    | "cosecha_real";
  titulo: string;
  descripcion?: string;
  zona_id?: string;
  zona_nombre?: string;
  color: string;
}
```

La función `buildEventosCalendario(terreno, zonas, plantas, catalogoCultivos, alertas, cosechas): EventoCalendario[]` en `src/lib/utils/calendario-eventos.ts` consolida todas las fuentes.

---

## Notas de implementación

- No instalar librería de calendario externa — implementar el grid con CSS Grid (simple y liviano)
- Reutilizar `calcularAlertas()` de `alertas.ts` y `calcularProyeccionAnual()` de `agua-proyeccion-anual.ts`
- El calendario es read-only en esta fase — no se crean tareas manuales
- Si en el futuro se quieren tareas manuales, se agrega el modelo `Tarea` en una FASE_18B
