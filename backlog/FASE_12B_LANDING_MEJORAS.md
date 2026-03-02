# FASE 12B — Landing Page: SEO + Accesibilidad + UX Conversión

## Contexto

El landing SSG (`src/app/page.tsx`) fue rediseñado visualmente en sesiones anteriores y tiene una base sólida (paleta verde-tierra, Playfair Display, sección Antes/Ahora, copy orientado a dolor). Sin embargo, una auditoría multi-agente detectó problemas críticos de SEO, accesibilidad y conversión que deben corregirse antes de lanzar el producto al público.

**Audiencia objetivo:** Agricultores 50-70 años, norte de Chile. Baja afinidad tecnológica. Usan celular. Sus hijos pueden ayudarles a adoptar el software.

**Producto:** AgriPlan — $9.990 CLP/mes, trial 6 meses gratis sin tarjeta.

---

## Fuente de esta fase

Auditoría realizada con equipo de agentes (design-auditor + skills-researcher) el 2026-03-01:

- Análisis de código del landing actual
- Benchmarks de software agrícola: Granular, FarmLogs, Climate FieldView
- Investigación de mejores prácticas UX para usuarios 50+
- Evaluación de skills disponibles aplicables

---

## Tareas

### Tarea 1 — SEO Básico (Meta Tags + Open Graph) 🔴 CRÍTICA

**Problema:** El landing no tiene `<title>`, `<meta description>` ni Open Graph. Invisible para Google y WhatsApp.

**Solución:** Usar Next.js 16 Metadata API en `src/app/page.tsx`.

```ts
export const metadata: Metadata = {
  title: "AgriPlan — Software agrícola para el norte de Chile",
  description:
    "Planifica tu campo, controla el agua y proyecta tu ROI. Software para agricultores del norte de Chile. 6 meses gratis, sin tarjeta.",
  openGraph: {
    title: "AgriPlan — Deja de plantar a ojo",
    description:
      "Calcula cuánta agua necesita cada zona, qué cultivos convienen y cuándo recuperas tu inversión. 6 meses gratis.",
    type: "website",
    locale: "es_CL",
  },
  keywords: [
    "software agrícola Chile",
    "gestión riego norte Chile",
    "planificación cultivos Arica",
    "ROI agricultura",
  ],
};
```

**Impacto:** Aparece en Google. Link se ve bien al compartir por WhatsApp.

---

### Tarea 2 — Schema JSON-LD (Structured Data) 🔴 CRÍTICA

**Problema:** Sin structured data, Google no puede mostrar rich results (precio, rating, trial).

**Solución:** Agregar `<script type="application/ld+json">` en el layout o directamente en `page.tsx`.

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "AgriPlan",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web, iOS, Android",
  "offers": {
    "@type": "Offer",
    "price": "9990",
    "priceCurrency": "CLP",
    "priceValidUntil": "2027-01-01",
    "description": "6 meses de prueba gratuita, sin tarjeta de crédito"
  },
  "description": "Software de planificación agrícola para agricultores del norte de Chile. Control de agua, ROI por cultivo y alertas automáticas.",
  "url": "https://agriplan.cl",
  "inLanguage": "es-CL"
}
```

**Impacto:** Rich results en Google con precio y trial visibles.

---

### Tarea 3 — Accesibilidad Visual (Texto 18px+, Touch Targets) 🔴 CRÍTICA

**Problema:** Audiencia 50-70 años. Body text actual usa `text-sm` (≈14px) en múltiples secciones. Botones CTA pueden ser muy pequeños en móvil. Mínimo recomendado: 18px body, 48px botones.

**Auditoría de tamaños actuales (a corregir):**

- Pain point cards: `text-sm` → subir a `text-base` (16px mínimo, idealmente 18px)
- Feature cards description: `text-sm` → `text-base`
- Step descriptions: `text-sm` → `text-base`
- Cultivos beneficio: `text-sm` → `text-base`
- ROI descriptions: `text-sm` → `text-base`

**Botones:**

- CTA principal "Ver planner" / "Crear cuenta gratis": verificar altura mínima 48px en móvil
- NavAccessButton: agregar `min-h-[44px]` para touch target correcto

**Impacto directo en conversión con la audiencia objetivo.**

---

### Tarea 4 — Iconografía en Sección Funciones 🟡 ALTA

**Problema:** La sección `#funciones` tiene 6 feature cards con texto puro. Score visual 5/10 según auditoría. Una persona mayor escanea con iconos, no lee párrafos.

**Solución:** Agregar SVG icons (24-28px) a cada feature card del array `FEATURES`. Ya existen SVGs para Terreno, Agua, Economía, Alertas, Catálogo, Offline — están definidos en el código pero NO se muestran en el landing (solo en la app). Reutilizarlos.

**Estado actual:** Los iconos YA están en el array `FEATURES` como JSX (`f.icon`), pero el componente los renderiza como `<div className="w-5 h-5">{f.icon}</div>` — verificar que se muestren correctamente en el landing y ajustar tamaño a 24px.

---

### Tarea 5 — FAQ Mínimo 🟡 ALTA

**Problema:** Agricultores mayores tienen preguntas que, sin respuesta, no convierten. La landing no tiene FAQ.

**Solución:** Agregar sección FAQ antes del footer con 5-6 preguntas reales:

| Pregunta                          | Respuesta                                                                                   |
| --------------------------------- | ------------------------------------------------------------------------------------------- |
| ¿Es realmente gratis por 6 meses? | Sí. Sin tarjeta, sin letra chica. Después del período, $9.990/mes si quieres seguir.        |
| ¿Necesito internet para usarla?   | Para registrarte sí. Después funciona sin señal. Tus datos quedan guardados en el teléfono. |
| ¿Mis datos están seguros?         | Sí. Se guardan en tu teléfono y en servidores seguros. No compartimos tu información.       |
| ¿Funciona en cualquier celular?   | Sí. Android e iPhone. No necesitas instalar nada, funciona desde el navegador.              |
| ¿Qué pasa si cancelo?             | Nada. Tus datos siguen disponibles. No hay contratos ni multas.                             |
| ¿Hay soporte si tengo problemas?  | Sí. Puedes escribirnos por WhatsApp.                                                        |

**Diseño:** Acordeón simple (CSS puro, sin JS), fondo crema `#f5ede0`, tipografía clara 16-18px.

---

### Tarea 6 — Animaciones Scroll-Triggered 🟢 MEDIA

**Problema:** Solo el hero tiene animaciones. Las secciones de Problema, Antes/Ahora, Funciones, Cómo funciona, ROI entran estáticas al hacer scroll. Impacto percibido de "modernidad" y calidad.

**Solución:** CSS puro con `animation-timeline: view()` (soportado en Chrome/Edge modernos) o clase `.fade-in-section` con `IntersectionObserver` vía un pequeño client component.

```css
@keyframes fadeInSection {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.scroll-fade {
  animation: fadeInSection 0.6s ease both;
  animation-timeline: view();
  animation-range: entry 0% entry 30%;
}
```

**Aplicar a:** headings de sección, cards de pain points, feature cards, step cards, cultivo cards, ROI cards.

**Nota:** Para SSG, `animation-timeline: view()` es CSS puro sin JS. Verificar soporte y agregar fallback para Safari.

---

### Tarea 7 — Integración y Verificación Final 🔴 CRÍTICA

**Checklist de integración:**

- [ ] `pnpm build` sin errores TypeScript
- [ ] `pnpm lint` sin warnings nuevos
- [ ] Verificar metadata aparece en `<head>` al hacer view-source
- [ ] Verificar JSON-LD en Google Rich Results Test
- [ ] Probar en móvil (iOS Safari + Android Chrome): tamaños de texto, touch targets
- [ ] Verificar que `dynamic = "force-static"` sigue activo (no se convirtió en SSR por el metadata)
- [ ] Open Graph: compartir link por WhatsApp y verificar preview
- [ ] Lighthouse score: apuntar a 90+ en Performance, 95+ en Accessibility, 90+ en SEO
- [ ] NavAccessButton sigue funcionando (auth-aware, client component)

---

## Resumen de impacto esperado

| Métrica                  | Antes        | Después                       |
| ------------------------ | ------------ | ----------------------------- |
| Visibilidad Google       | ❌ Invisible | ✅ Indexable con rich results |
| Lighthouse SEO           | ~40          | ~90+                          |
| Lighthouse Accessibility | ~70          | ~90+                          |
| Legibilidad 50+          | ⚠️ 14px body | ✅ 16-18px body               |
| Conversión landing       | ~7/10        | ~8.5/10                       |
| Tiempo de implementación | —            | ~4-6h                         |

---

## Skills a utilizar

- `/seo` — Meta tags, Open Graph, keywords
- `/seo-schema` — JSON-LD SoftwareApplication
- `/seo-technical` — Core Web Vitals audit post-implementación
- `/frontend-design` — Tamaños texto, iconografía, FAQ styling, animaciones
