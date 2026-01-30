Sugerencias de Agent Teams para AgriPlan PWA

Basadas en las 6 auditorías recientes + análisis de estructura,
complejidad y gaps.

---

1. Refactor Componentes Gigantes

"Crea un team de 2: un teammate que analice
pixi-mapa-terreno-inner.tsx (850 líneas) e identifique cómo
dividirlo en subcomponentes/hooks manteniendo la lógica PixiJS,
y otro que haga lo mismo con map-sidebar.tsx (530 líneas)
extrayendo los paneles de ROI, agua y zonas en componentes
independientes"

- Archivos:
  src/components/mapa/pixi/pixi-mapa-terreno-inner.tsx,
  src/components/mapa/map-sidebar.tsx
- Resultado: Plan de refactor con cortes propuestos, props
  interfaces, y hooks a extraer.

---

2. Auditoría Sync Engine + Queue

"Team de 2: uno que revise src/lib/sync/engine.ts y
src/lib/sync/queue.ts buscando race conditions, retry sin
backoff, operaciones perdidas en offline, y error handling
incompleto; otro que revise use-sync.ts y los componentes sync/
(offline-banner, sync-indicator, conflict-modal) verificando que
los estados de sync se reflejen correctamente en la UI"

- Archivos: src/lib/sync/engine.ts, src/lib/sync/queue.ts,
  src/hooks/use-sync.ts, src/components/sync/
- Resultado: Lista de bugs potenciales en sync offline, gaps en
  UX de conflictos.

---

3. Validaciones vs Realidad

"Crea un team de 2: un teammate que mapee TODAS las validaciones
definidas en src/lib/validations/ (zona.ts, planta.ts, agua.ts,
suelo.ts, cultivo-restricciones.ts) y otro que busque en los
hooks y páginas si esas validaciones realmente se están usando
antes de llamar al DAL, o si hay writes sin validar"

- Archivos: src/lib/validations/\*.ts vs
  src/hooks/use-plantas.ts, use-zonas.ts, use-agua.ts
- Resultado: Tabla cruzada validación-vs-uso, lista de writes al
  DAL sin validar.

---

4. Consistencia de Datos Estáticos

"Team de 2: uno que verifique que todos los cultivos en
data/static/cultivos/arica.json tengan los campos requeridos por
el código (agua_m3_ha_año_min/max, espaciado_recomendado_m,
tiempo_produccion_meses, Kc) cruzando con los guards recién
agregados en agua.ts; otro que verifique que kc-cultivos.ts y
duracion-etapas.ts cubran los mismos cultivos del catálogo sin
huecos"

- Archivos: data/static/cultivos/arica.json,
  src/lib/data/kc-cultivos.ts, src/lib/data/duracion-etapas.ts
- Resultado: Lista de cultivos con campos faltantes o sin
  cobertura Kc/duración.

---

5. Plagas + Suelo Edge Cases

"Crea un team de 2: un teammate que audite
src/lib/utils/riesgo-plagas.ts y src/app/plagas/page.tsx
buscando los mismos patrones de NaN/undefined/empty que
encontramos en agua.ts, y otro que revise
src/lib/utils/calidad.ts y src/components/suelo/ verificando que
inputs de suelo con valores extremos (pH 0, CE 100, boro
negativo) no produzcan factores fuera de rango"

- Archivos: src/lib/utils/riesgo-plagas.ts,
  src/app/plagas/page.tsx, src/lib/utils/calidad.ts,
  src/components/suelo/
- Resultado: Lista de edge cases y valores extremos no
  guardados.

---

6. DAL Transaccional

"Team de 2: uno que revise todos los archivos en src/lib/dal/
verificando si las operaciones multi-tabla (ej: eliminar zona +
sus plantas) usan transacciones Dexie o pueden quedar en estado
inconsistente; otro que busque en los hooks todos los patrones
de 'múltiples awaits secuenciales al DAL' que deberían ser
atómicos"

- Archivos: src/lib/dal/\*.ts, src/hooks/use-zonas.ts (cascade
  delete), use-plantas.ts
- Resultado: Mapa de operaciones que necesitan transacciones
  Dexie.

---

7. Test Foundation

"Crea un team de 2: un teammate que diseñe la configuración
mínima de Vitest para este proyecto (config, mocks de
Dexie/IndexedDB, setup file) y escriba tests para las 3
funciones más críticas de src/lib/utils/agua.ts; otro que haga
lo mismo para src/lib/utils/roi.ts y
src/lib/utils/comparador-cultivos.ts"

- Archivos: src/lib/utils/agua.ts, src/lib/utils/roi.ts,
  src/lib/utils/comparador-cultivos.ts
- Resultado: Setup de Vitest + primeros 10-15 unit tests
  cubriendo cálculos de negocio core.
- Nota: Actualmente hay 0 tests en todo el proyecto.

---

8. Pages Data Loading Dedup

"Team de 2: uno que identifique el patrón repetido de carga de
datos en las páginas (terreno → zonas → cultivos → plantas en
useEffect) comparando agua/page.tsx, economia/page.tsx,
economia/avanzado/page.tsx, escenarios/page.tsx y
agua/planificador/page.tsx; otro que proponga un hook unificado
(ej: useTerrainData) que extraiga ese patrón común y evalúe si
un React Context sería más apropiado"

- Archivos: src/app/agua/page.tsx, src/app/economia/page.tsx,
  src/app/economia/avanzado/page.tsx, src/app/escenarios/page.tsx,
  src/app/agua/planificador/page.tsx
- Resultado: Propuesta de hook/context unificado con API y plan
  de migración.
