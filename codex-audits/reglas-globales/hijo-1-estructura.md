# Hijo 1 – Estructura y Boundaries

Alcance: organización por carpetas, tamaño y responsabilidad de archivos (sin tests).

Hallazgos:
- Estructura base clara por dominio: `src/app` (rutas), `src/components` (agrupados por dominio), `src/lib` (constants, data, utils, dal, sync), `src/contexts` para estado global, `src/hooks` especializados.
- Alias `@/*` habilitado en `tsconfig.json` para imports absolutos (cumple regla de imports limpios).

Brechas / riesgos:
- `src/app/page.tsx` (~400 líneas) mezcla gating de auth, estados vacíos, layout, modales y vista Pixi. Excede los 200–300 recomendados; sugiere dividir en contenedores (ej. `AuthGate`, `EmptyState`, `MapShell`, `HeaderActions` aparte) para responsabilidades únicas.
- `src/components/mapa/pixi/use-map-interactions.ts` (~462 líneas) concentra toda la lógica de puntero (pan/zoom, selección múltiple, grid, drawing). Alto acoplamiento; candidato a partir en módulos específicos (p.ej. manejo de arrastre, selección, creación de zonas) y mover constantes a `pixi-constants`.
- `src/types/index.ts` (~580 líneas) es un monolito de tipos de dominio. Considera seccionar por dominio (`types/agua.ts`, `types/terreno.ts`, `types/plagas.ts`, etc.) y re-exportar con barrel para mantener un SST por concepto y archivos más pequeños.

Notas: no se detectaron carpetas duplicadas; el reparto por dominio es consistente con el backlog. 
