# Auditoría de Reglas Globales - AgriPlan PWA

**Fecha**: 2026-02-27
**Alcance**: Proyecto completo (`src/`, `data/`, `public/`)
**Enfoque**: Investigación sin modificaciones

---

## Reglas Agnósticas a Evaluar

Basadas en estándares de calidad de código global:

### 0. Cuidado y Disciplina
- ❌ NO duplicar carpetas, archivos ni bloques de código
- ❌ NO dejar `catch` vacíos sin explicación
- ❌ NO hardcodear números/cadenas; usar constantes nombradas
- ✅ Inmutabilidad por defecto (preferir `const` sobre `let`)

### 1. Flujo de Trabajo
- ✅ Cambios pequeños (máx 300–400 líneas netas)
- ✅ Todo pasa por PR con revisión (no commits directos a main)
- ✅ Antes de crear, revisar si existe en utils/, helpers/, lib/

### 2. Código Limpio y Organización
- ✅ Un archivo = una responsabilidad clara
- ✅ Separar datos estáticos de lógica
- ✅ Extraer lógica repetida en funciones utilitarias
- ✅ Componentes pequeños (< 200–300 líneas)
- ✅ Barrel exports (index) para imports limpios

### 3. Single Source of Truth (SST)
- ✅ Constantes centralizadas por dominio (`src/lib/constants/`)
- ✅ Query/cache keys centralizadas
- ✅ Storage keys centralizadas
- ✅ Una sola fuente de verdad por concepto

### 4. Eliminación de Duplicación (DRY)
- ✅ No duplicar funciones utilitarias
- ✅ No duplicar constantes/listas
- ✅ Si se repite 2–3+ veces → convertir en helper
- ✅ Si se repite UI múltiples veces → componente

### 5. Tipado y Seguridad
- ✅ Preferir enums/constantes tipadas
- ✅ Evitar `any` sin justificación
- ✅ Tipos explícitos entre capas
- ✅ Validar contratos con interfaces/DTOs

### 6. Nomenclatura
- ✅ Nombres alineados al dominio
- ✅ Intención (qué hace), no implementación (cómo)
- ✅ Consistencia en convenciones

### 7. Manejo de Estado y Datos
- ✅ Preferir estado derivado
- ✅ Evitar recomputación/duplicación

---

## Plan de Audits Hijos

Se generarán **6–8 audits hijos** secuencialmente para cubrir el proyecto sin solapamiento:

| # | Hijo | Tema | Alcance | Estado |
|---|------|------|---------|--------|
| 1 | `1-duplicacion-codigo.md` | DRY / Duplicación | Funciones, constantes, componentes | ✅ Completado |
| 2 | `2-sst-centralizacion.md` | SST / Centralización | Constants, query-keys, storage-keys | ✅ Completado |
| 3 | `3-tipado-seguridad.md` | Tipado / `any` / Interfaces | Tipos inseguros, DTOs | ✅ Completado |
| 4 | `4-tamaño-archivos.md` | Tamaño & Responsabilidad | Archivos > 300 líneas | ✅ Completado |
| 5 | `5-nomenclatura.md` | Naming Consistency | Variables, funciones, archivos | ⏳ Pendiente |
| 6 | `6-error-handling.md` | Error Handling | `catch` vacíos, logging, manejo | ⏳ Pendiente |
| 7 | `7-estado-derivado.md` | Estado & Computado | Derivado vs imperativo | ⏳ Pendiente |

---

## Metodología

### Fase 1: Investigación (ACTUAL)
- ✅ Explorar estructura del proyecto
- ✅ Generar hijos secuencialmente
- ✅ Reportar hallazgos sin modificar código
- ✅ Actualizar estado en tabla padre

### Fase 2: Decisión (POSTERIOR)
- User revisa hallazgos
- User decide qué priorizar (crítico, importante, técnico)
- Crear PRs con fixes basados en prioridades

---

## Resultados de Investigación

*Se actualizarán conforme se completen audits hijos.*

### Resumen por Regla
- [ ] Regla 0 (Cuidado): 👀 En revisión
- [ ] Regla 1 (Flujo): ✅ Cumple
- [ ] Regla 2 (Limpieza): ⚠️ 85% (3 archivos: use-map-interactions, page.tsx, alertas.ts)
- [ ] Regla 3 (SST): ✅ Cumple 85% (2 mejoras pendientes)
- [ ] Regla 4 (DRY): ⚠️ 3 brechas críticas detectadas
- [ ] Regla 5 (Tipado): ✅ Cumple 100% (Excelente - 0 `any`, strict mode)
- [ ] Regla 6 (Nomenclatura): 👀 En revisión
- [ ] Regla 7 (Estado): 👀 En revisión

### Brechas Críticas Identificadas
*Se llenarán después de audits.*

### Recomendaciones Generales
*Se establecerán al final.*

---

## Referencias

- `CLAUDE.md` - Contexto específico del proyecto
- `src/` - Código fuente principal
- `data/` - Datos estáticos
- Audits previos: `audit-*.md`, `*_AUDIT.md`

---

**Estado actual**: Audits 1-4 completos. Progresando secuencialmente.

**Hallazgos acumulados**:
- 🔴 1 CRÍTICO: `safeParseFloat/Int` duplicado (15+ instancias)
- 🔴 1 CRÍTICO: `use-map-interactions.ts` muy grande (462 líneas)
- 🟠 2 IMPORTANTES: SSR pattern duplicado, rutas no centralizadas
- 🟠 1 IMPORTANTE: `page.tsx` muy grande (400 líneas)
- 🟠 1 IMPORTANTE: `alertas.ts` podría dividirse (322 líneas)
- 🟡 3 TÉCNICOS: Componentes borderline (200-210 líneas), Consumo de agua
- ✅ EXCELENTE: TypeScript 100% seguro (0 `any`, strict mode, DTOs bien definidos)

**Próximo paso**: Generar `5-nomenclatura.md`
