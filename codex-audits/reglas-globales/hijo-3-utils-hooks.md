# Hijo 3 – Utils, Helpers y Hooks (DRY)

Alcance: reutilización de lógica en helpers/hooks, detección de duplicación funcional.

Hallazgos positivos:
- `lib/helpers/dal-mutation.ts` centraliza manejo de mutaciones con logging y refetch (usado en `use-zonas` y `use-plantas`).
- Validaciones de dominio se concentran en `lib/validations/` y se consumen desde hooks antes de mutar (zonas, plantas).

Brechas / oportunidades de DRY:
- Conteo de entidades se repite con lógica ad hoc: `use-proyectos.ts` calcula cascadas para borrar (`contarContenido`), `terrenos/page.tsx` vuelve a contar zonas/plantas por terreno para mostrar métricas, y `use-terrenos.ts` tiene otro `contarContenido`. Un helper común (p.ej. `dal/counts.ts`) evitaría divergencias y duplicación de acceso a DAL.
- Invalidación de React Query se repite con patrones similares en varios hooks (`use-proyectos`, `use-terrenos`); un helper pequeño (`invalidateByKey`) o wrapper podría reducir código repetido y riesgos de olvidar claves.
