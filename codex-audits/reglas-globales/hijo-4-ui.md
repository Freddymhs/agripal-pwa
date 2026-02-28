# Hijo 4 – Componentes/UI

Alcance: reutilización de UI, componentes pequeños, evitar bloques repetidos.

Hallazgos positivos:
- Componentes están agrupados por dominio (`components/mapa`, `terreno`, `alertas`, `sync`) y se usan en App Router con imports absolutos.
- Modalidad reutilizable: modales de creación/edición (`CrearProyectoModal`, `CrearTerrenoModal`, `NuevaZonaModal`) y barras (`MapToolbar`, `MapInfoBar`, `MapSidebar`).

Brechas:
- `src/app/page.tsx` define múltiples estados vacíos/hero y loaders inline; `src/app/terrenos/page.tsx` implementa otro loader custom. Considerar un componente de loading/empty reusable para mantener consistencia y evitar duplicados de UI.
- `HeaderActions` vive dentro de `page.tsx`; moverlo a `components/layout` lo haría reutilizable en rutas interiores y reduciría tamaño del archivo.
