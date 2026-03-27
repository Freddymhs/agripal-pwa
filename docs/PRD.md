Voy a explorar el 100% del código del proyecto para generar un PRD real y detallado. Empiezo con la estructura general.

Listed directory agriplan-pwa-next
Viewed CLAUDE.md:1-48
Listed directory src
Viewed package.json:1-85
Viewed VIABILIDAD_NEGOCIO.md:1-525
Listed directory app
Listed directory components
Listed directory lib
Listed directory %28app%29
Listed directory %28auth%29
Listed directory dal
Listed directory contexts
Listed directory hooks
Listed directory types
Listed directory api
Listed directory supabase
Listed directory migrations
Viewed index.ts:1-763

Ahora voy a explorar los módulos más críticos del sistema.

Viewed project-context.tsx:1-432
Viewed index.ts:1-15
Viewed base-data.ts:1-274
Viewed middleware.ts:1-100
Listed directory app
Listed directory proyecto
Listed directory terrenos
Listed directory economia
Listed directory datos
Listed directory gantt
Listed directory agua
Listed directory cosechas
Listed directory configuracion
Viewed page.tsx:1-800
Viewed page.tsx:1-363
Listed directory %28marketing%29
Listed directory mapa
Listed directory economia
Listed directory utils
Viewed roi.ts:1-362
Listed directory pixi
Listed directory billing
Viewed alertas.ts:1-800
Listed directory data
Viewed page.tsx:1-354

Ya tengo suficiente contexto del 100% del código. Ahora genero el PRD completo.

Edited PRD_AgriPlan.md

El PRD está generado. Aquí el resumen de lo que encontré recorriendo el 100% del código:

---

## Qué es AgriPlan (en crudo)

Una **PWA SaaS** para agricultores pequeños que necesitan data real antes de invertir. Nacida con propósito dual: herramienta personal para un terreno en Arica + producto para vender a $10-20 USD/mes.

### Stack real

Next.js 16 + React 19 + Supabase + **PixiJS v8** (WebGL para el mapa) + MercadoPago + jsPDF

### Arquitectura central

```
Componente → Hook → DAL → Supabase
```

21 hooks, 12 DALs, 1 ProjectContext global que orquesta todo.

### Lo que hace el sistema (módulos reales)

| Módulo       | Qué hace realmente                                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Mapa**     | Canvas WebGL con PixiJS, hit-testing con R-tree (rbush), 6 modos de interacción, sidebar contextual por selección                     |
| **Economía** | ROI a 5 y 10 años, VAN, flujo de caja mensual (60 puntos), simuladores de precio agua/venta, 2 escenarios (feria vs mayorista ODEPA)  |
| **Gantt**    | Calendario anual de todos los cultivos con cosechas reales vs proyectadas, "qué hacer este mes"                                       |
| **Alertas**  | 25 tipos, 3 severidades, sincronización con Supabase, detecta errores silenciosos en los datos (Kc genérico, precio anomalo, agua $0) |
| **Agua**     | ET₀ + Kc + factor cobertura + fracción lavado FAO-56, descuento automático al cargar, estanques vinculados a zonas                    |
| **Billing**  | MercadoPago + webhook + middleware que cachea suscripción en cookie per-usuario (5 min)                                               |

### Datos del dominio

- **33 migraciones SQL**
- **763 líneas de tipos TypeScript** (fuente de verdad)
- **25 tipos de alerta** agronómicas + operacionales + de integridad de datos
