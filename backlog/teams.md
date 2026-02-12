Sugerencias de Agent Teams para AgriPlan PWA

Basadas en las 6 auditorías recientes + análisis de estructura,
complejidad y gaps.

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
