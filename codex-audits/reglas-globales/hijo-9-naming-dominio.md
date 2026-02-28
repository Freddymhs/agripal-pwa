# Hijo 9 – Naming y Consistencia de Dominio

Alcance: nombres de tipos/constantes/funciones alineados al dominio.

Hallazgos positivos:
- Nombres de tipos y constantes reflejan el dominio local (ej. `Terreno`, `Zona`, `CULTIVOS_ESPACIADO`, `TIPO_ZONA`, `ESTADO_PLANTA`), lo que facilita comprensión regional.
- Uso consistente de español en componentes y hooks (`useTerrenos`, `useProyectos`, `useAlertas`), alineado al lenguaje del usuario final.

Brechas:
- Mezcla de convenciones en modelos: se combinan `snake_case` con acentos (`calidad_señal`) y tipos camel case sin acento (`CalidadSenal`) en `src/types/index.ts`. Esto puede generar errores sutiles y reduce compatibilidad ASCII. Definir una convención única (ej. snake_case sin tildes) y normalizar progresivamente.
- Algunas funciones mantienen nombres genéricos (p.ej. `handleGuardarTerreno` vs `handleGuardarConfigAvanzada` más específico). Revisar que cada handler refleje intención concreta al cambiar comportamiento.
