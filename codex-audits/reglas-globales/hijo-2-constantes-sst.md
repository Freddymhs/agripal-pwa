# Hijo 2 – Single Source of Truth / Constantes

Alcance: constantes, llaves de cache/storage, listas de dominio, hardcodes visibles.

Hallazgos positivos:
- Constantes centralizadas en `src/lib/constants/` (query keys, storage keys, enums/tipos, conversiones numéricas, umbrales, sync) con barrel `index.ts` (cumple SST por concepto).
- Datos estáticos separados en `src/lib/data/` (cultivos, clima, suelo, umbrales) y usados por hooks/validaciones.
- Llaves de cache y storage unificadas en `QUERY_KEYS` y `STORAGE_KEYS` (usadas en hooks y contexts).

Brechas:
- Usuario fijo hardcodeado en `src/hooks/use-proyectos.ts:30` (`USUARIO_ID = 'usuario-demo'`). Debería vivir en un config/env central (o venir del contexto de auth) para no duplicar cadenas sensibles y permitir multi-usuario real.
- `src/components/mapa/pixi/use-map-interactions.ts:87` usa `espaciado || 3` como fallback. No está atado a `ESPACIADO_MINIMO_M` (`lib/constants/conversiones.ts`) ni al catálogo; puede divergir del SST de espaciamiento.
- `DRAG_THRESHOLD = 5` y otros números de interacción en `use-map-interactions.ts` están in situ; moverlos a `pixi-constants` mantendría un único origen y documentaría la intención (regla de no hardcodear números mágicos).
