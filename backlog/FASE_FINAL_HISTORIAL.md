# FASE FINAL: Historial de Cambios (UI)

**Status**: ⏳ PENDIENTE — implementar al final
**Prioridad**: 🟢 BAJA
**Dependencias**: todas las fases anteriores
**Estimación**: 2-3 horas
**Última revisión**: 2026-03-01

---

## Estado Real del Código (auditado 2026-03-01)

El backend está completo. Solo falta la UI.

| Aspecto                                           | Estado                                                                                                                                                                                                          |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modelo `HistorialEntrada` en `src/types/index.ts` | ✅ Existe                                                                                                                                                                                                       |
| Tabla `historial` en IndexedDB                    | ✅ Existe (`historial: '++id, usuario_id, entidad, created_at'`)                                                                                                                                                |
| DAL para historial                                | ❌ NO existe — los DALs actuales no escriben en `db.historial`. Crear `src/lib/dal/historial.ts` e instrumentar cada DAL (terrenos, zonas, plantas, agua, cosechas) para que registre cada create/update/delete |
| Página `/historial`                               | ❌ NO existe                                                                                                                                                                                                    |

---

## Objetivo

Dar al usuario visibilidad de todos los cambios que ha hecho en su proyecto: qué editó, cuándo, y qué valor tenía antes. Útil para auditoría personal y para deshacer errores.

---

## Funcionalidades (solo UI)

### Página `/historial`

- Lista cronológica de cambios (más reciente primero)
- Agrupados por día
- Cada entrada muestra:
  - Acción: `creó`, `modificó`, `eliminó`
  - Entidad: `terreno`, `zona`, `planta`, `entrada_agua`, etc.
  - Descripción legible: "Modificó zona **Zona A** del terreno **Los Pinos**"
  - Timestamp

### Filtros

- Por fecha (rango)
- Por tipo de acción (crear / modificar / eliminar)
- Por entidad (terreno, zona, planta, agua, etc.)
- Por terreno

### Vista de detalle (diff)

- Click en una entrada → modal con `datos_anterior` vs `datos_nuevo`
- Resaltar campos que cambiaron

### Post-Supabase (futuro lejano)

- Historial sincronizado entre dispositivos
- Exportar a PDF/CSV

---

## Archivos a crear

| Archivo                                             | Descripción                                 |
| --------------------------------------------------- | ------------------------------------------- |
| `src/app/historial/page.tsx`                        | Página principal                            |
| `src/app/historial/error.tsx`                       | Error boundary                              |
| `src/components/historial/historial-list.tsx`       | Lista cronológica agrupada por día          |
| `src/components/historial/historial-diff-modal.tsx` | Modal de diff datos_anterior vs datos_nuevo |
| `src/lib/constants/routes.ts`                       | Agregar `ROUTES.HISTORIAL = "/historial"`   |

---

## Notas

- Se implementa al final porque depende de que toda la app esté generando entradas de historial correctamente
- Verificar que los DALs realmente escriben en `db.historial` antes de implementar la UI
- La UI es read-only — no se puede "deshacer" desde aquí en esta fase
