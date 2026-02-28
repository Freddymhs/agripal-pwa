# Hijo 8 – Configuración y Build

Alcance: Next config, TS, PWA, react-query, Dexie.

Hallazgos positivos:
- `next.config.ts` integra `@ducanh2912/next-pwa` con cachés declaradas (fonts, imágenes, static, JS/CSS); se desactiva en `development`.
- `tsconfig.json` con `strict: true`, paths `@/*`, módulos bundler; `isolatedModules` activo.
- `react-query` inicializado en `lib/react-query.ts` con tiempos de stale/gc definidos (SST de cache behavior).
- Dexie DB versionada (1 y 2) en `lib/db/index.ts` con tablas explícitas y claves compuestas para sync.

Brechas / notas:
- `next.config.ts` solo establece `turbopack: {}` sin opciones; si no se usa, podría omitirse o documentarse para evitar confusión.
- `allowJs: true` en `tsconfig` no parece necesario (todo el código está en TS); si se mantiene, documentar el motivo.
- No hay comprobación de variables sensibles en build (e.g., `JWT_SECRET`); agregar validación en tiempo de build evitaría que el fallback inseguro llegue a producción.
