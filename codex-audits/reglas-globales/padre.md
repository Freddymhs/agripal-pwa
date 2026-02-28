# Auditoria Reglas Globales (agnóstico)

Alcance: revisión secuencial del código (sin tocar tests) contra las reglas 0–7 que pasaste. Sin cambios de código, solo hallazgos. Carpeta: `audits/reglas-globales/`.

Metodología: lectura de estructura, TS/React (App Router), lib/constantes/utils, hooks, PWA/sync y seguridad. Se usó navegación directa de archivos; no se ejecutaron tests ni build.

Ruta de investigaciones (estado = hecho):
1) `hijo-1-estructura.md` – límites por archivo/módulo, tamaños.
2) `hijo-2-constantes-sst.md` – single source of truth, hardcodes.
3) `hijo-3-utils-hooks.md` – duplicación en helpers/hooks.
4) `hijo-4-ui.md` – reutilización de componentes/UI y pesos.
5) `hijo-5-estado-datos.md` – estado derivado vs duplicado, riesgos.
6) `hijo-6-errores-logging.md` – manejo de errores y visibilidad.
7) `hijo-7-seguridad-validaciones.md` – contratos de entrada/tokens.
8) `hijo-8-config-build.md` – configuración Next/PWA/TS.
9) `hijo-9-naming-dominio.md` – nomenclatura y consistencia de dominio.

Siguientes pasos sugeridos: revisar cada hijo, priorizar correcciones por severidad (seguridad y SST primero), abrir issues/PRs pequeños (<400 líneas) por hallazgo.
