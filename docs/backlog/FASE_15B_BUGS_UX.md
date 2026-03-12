# FASE 15B: Bugs Críticos de UX (Pre-Supabase)

**Status**: ✅ COMPLETA
**Prioridad**: 🔴 ALTA
**Dependencias**: ninguna
**Última revisión**: 2026-03-12

---

## Contexto

Bugs y confusiones UX encontrados durante auditoría de usuario real (2026-02-05), documentados en `UX_AUDIT_USUARIO_REAL.md`. Los bugs aún sin resolver afectan la confianza y usabilidad del core de la app. No hay dependencia técnica con FASE_12 — pueden implementarse en paralelo o después de ella.

---

## Bugs a Resolver

### BUG-01: Plantar en Grilla sobreescribe plantas manuales

**Severidad**: ALTA
**Ubicación**: `src/components/plantas/grid-automatico-modal.tsx`
**Descripción**: "Plantar en Grilla" elimina todas las plantas existentes de la zona y las reemplaza por la grilla nueva.
**Fix esperado**: Antes de plantar la grilla, verificar posiciones ocupadas. Dos opciones:

1. Rellenar solo las posiciones vacías (preferido)
2. Mostrar un dialog de confirmación: "Hay X plantas existentes. ¿Reemplazar todo o solo rellenar vacíos?"

**Archivos involucrados**:

- `src/components/plantas/grid-automatico-modal.tsx` — lógica de generación de grilla
- `src/hooks/use-plantas-lote.ts` — función que ejecuta la creación en batch

---

### BUG-05: Click directo en zona/estanque no funciona en modo ZONAS

**Severidad**: MEDIA
**Ubicación**: `src/components/mapa/pixi/use-map-interactions.ts`
**Descripción**: Con la herramienta ZONAS activa, hacer click sobre una zona o estanque existente no la selecciona. El usuario debe primero hacer click en área vacía, luego en la zona.
**Fix esperado**: En el handler de `pointerdown`, cuando la herramienta activa es ZONAS, hacer hit-test sobre zonas existentes primero. Si hay match, seleccionarla (no iniciar creación de nueva zona).

**Archivos involucrados**:

- `src/components/mapa/pixi/use-map-interactions.ts` — handler de click/pointerdown
- `src/components/mapa/pixi/pixi-hit-test.ts` — lógica de hit testing

---

### BUG-10: m³/semana muestra 0.00 (verificar fix completo)

**Severidad**: ALTA
**Ubicación**: `src/components/agua/resumen-agua.tsx` (línea ~161)
**Estado actual**: Fix parcial — `useActualizarEtapas` conectado, pero aún requiere verificación end-to-end.
**Fix esperado**:

1. Verificar que `calcularConsumoZona()` recibe plantas con etapas actualizadas (no plántula por defecto)
2. Verificar que el valor calculado llega correctamente a `resumen-agua.tsx`
3. Bug-3 conocido en `resumen-agua.tsx` ~línea 161: etiqueta dice "L/día" pero valor es m³/día — corregir

**Archivos involucrados**:

- `src/components/agua/resumen-agua.tsx` — display final
- `src/lib/utils/agua.ts` — `calcularConsumoZona()`
- `src/hooks/use-agua.ts` — pipeline de datos

---

## Issues UX a Resolver

### UX-02: Flujo confuso "Registrar Agua" vs "Configurar Recarga"

**Impacto**: ALTO
**Fix**: Agregar texto de ayuda contextual en `/agua`:

- Sobre "Configurar Recarga": "Define cada cuánto llega el agua y a qué costo"
- Sobre "Registrar Agua": "Registra una entrada de agua que ya llegó hoy"
- Opcionalmente: numerarlos como paso 1 y paso 2

**Archivos involucrados**: `src/components/agua/resumen-agua.tsx` o `src/app/agua/page.tsx`

---

### UX-04: Gasto de riego no visible en panel de zona sin abrir modal

**Impacto**: ALTO
**Fix**: En el panel de zona, debajo de "Sistema de riego configurado", agregar una línea con el gasto estimado: "~X L/día · Y m³/semana". El dato ya existe en `zona.configuracion_riego`.

**Archivos involucrados**: `src/components/mapa/zona-riego-section.tsx`

---

### UX-06: Cálculos no transparentes — genera desconfianza

**Impacto**: CRÍTICO (según usuario real)
**Fix**: Agregar tooltips en los valores calculados clave que muestren la fórmula en lenguaje simple.

Valores prioritarios:

- Consumo semanal: "256 plantas × 2 goteros × 4 L/h × 6 h/día × 7 días × Kc 0.5 = 3.41 m³"
- ROI: "Ingresos (X kg × $Y/kg) − Costos agua ($Z/año) = $..."
- Días restantes: "Agua disponible ÷ consumo diario"

**Archivos involucrados**:

- `src/components/agua/resumen-agua.tsx`
- `src/components/mapa/zona-cultivo-panel.tsx`
- `src/components/proyeccion/roi-panel.tsx`

---

## Orden de ejecución sugerido

1. BUG-10 verificación (más crítico — afecta confianza en cálculos)
2. BUG-01 fix grilla (afecta flujo principal de plantación)
3. UX-06 tooltips cálculos (mayor impacto en confianza)
4. BUG-05 fix click zonas (UX básica del mapa)
5. UX-02 texto ayuda agua (orientación usuario nuevo)
6. UX-04 gasto riego visible (información inmediata sin modal)

---

## Notas

- Estos fixes son todos en código existente — no requieren nuevas páginas ni DALs
- Verificar con `pnpm lint` y `pnpm type-check` después de cada cambio
- BUG-10 requiere prueba manual end-to-end: crear zona, plantar, configurar agua, ver m³/semana
