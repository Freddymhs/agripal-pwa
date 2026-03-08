# FASE LAUNCH — Checklist de Lanzamiento

**Status**: ⏳ PENDIENTE — ejecutar cuando el dominio esté comprado
**Dependencias**: dominio `agriplan.cl` activo

---

## Paso 1 — Dominio y Deploy

- [ ] Comprar dominio `agriplan.cl`
- [ ] Conectar dominio a Vercel (o hosting elegido)
- [ ] Verificar que `https://agriplan.cl` responde correctamente
- [ ] Verificar que `https://agriplan.cl/sitemap.xml` responde 200
- [ ] Verificar que `https://agriplan.cl/robots.txt` responde 200
- [ ] Verificar security headers: `curl -I https://agriplan.cl`

---

## Paso 2 — Google Search Console 🔴 CRÍTICO

Sin esto Google no sabe que el sitio existe.

1. Ir a [search.google.com/search-console](https://search.google.com/search-console)
2. Agregar propiedad → tipo "Dominio" → ingresar `agriplan.cl`
3. Verificar ownership (opción recomendada: registro DNS TXT en el panel del dominio)
4. Una vez verificado → **Sitemaps** → agregar `https://agriplan.cl/sitemap.xml`
5. Solicitar indexación manual de las páginas principales:
   - `https://agriplan.cl`
   - `https://agriplan.cl/norte-chile`
   - `https://agriplan.cl/arica`
   - `https://agriplan.cl/tarapaca`
   - `https://agriplan.cl/comparativa`

> Google tarda 3-6 semanas en indexar un dominio nuevo. El Search Console acelera el proceso.

---

## Paso 3 — Verificación de Google en Next.js (opcional pero recomendado)

Si se usa verificación por meta tag en lugar de DNS:

```ts
// src/app/layout.tsx → metadata
verification: {
  google: "TU_CODIGO_DE_VERIFICACION_AQUI",
},
```

El código lo entrega Google Search Console al agregar la propiedad.

---

## Paso 4 — Open Graph y compartir

- [ ] Abrir WhatsApp → pegar `https://agriplan.cl` → verificar que aparece preview con título e imagen
- [ ] Compartir el link en al menos 2 lugares (redes sociales, grupos de WhatsApp, LinkedIn)
  - Cada compartido genera tráfico y señales para Google

---

## Paso 5 — Backlinks básicos (aceleran indexación)

- [ ] Agregar `https://agriplan.cl` en perfil GitHub del proyecto
- [ ] Agregar en perfil LinkedIn personal/empresa
- [ ] Si hay directorio de startups chilenas o agrícolas, registrarse

---

## Paso 6 — Verificación final Lighthouse

Ejecutar desde Chrome DevTools → Lighthouse en `https://agriplan.cl`:

| Métrica        | Objetivo |
| -------------- | -------- |
| Performance    | 90+      |
| Accessibility  | 95+      |
| Best Practices | 90+      |
| SEO            | 95+      |

---

## Monitoreo post-lanzamiento (semanas 2-6)

- Revisar Google Search Console semanalmente: impresiones, clics, páginas indexadas
- Si una página no aparece indexada después de 3 semanas → usar "Inspeccionar URL" en GSC y solicitar indexación
- Primer objetivo realista: aparecer en búsquedas de marca (`agriplan`, `agriplan chile`) en semana 2-3
- Segundo objetivo: aparecer en long-tail (`software agrícola Arica`) en semana 4-8
