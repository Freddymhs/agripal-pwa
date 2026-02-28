# Hijo 7 – Seguridad y Validaciones de Entrada

Alcance: contratos de tipos/DTO, validación de inputs, manejo de tokens.

Hallazgos positivos:
- Validaciones de dominio antes de mutar: `lib/validations` se usa en hooks de zonas/plantas para impedir solapes o estados inválidos.
- Tipos explícitos para entidades en `src/types` y uso consistente en hooks/components (evita objetos sin tipo entre capas).

Brechas críticas:
- Implementación JWT casera insegura en `src/lib/auth/jwt.ts`: el “token” concatena header/payload/signature con `btoa(JWT_SECRET)` sin HMAC/firmado real. Cualquier usuario puede falsificar tokens; además hay fallback `dev-secret-change-in-production` embebido. Requiere migrar a librería/algoritmo firmado (ej. jose/jsonwebtoken) o usar un adaptador seguro.
- Login (`src/app/auth/login/page.tsx`) acepta cualquier email/password y crea usuario en dev (banner lo indica). Si se expone fuera de dev, falta validación de política de contraseña y rate-limit/captcha.
