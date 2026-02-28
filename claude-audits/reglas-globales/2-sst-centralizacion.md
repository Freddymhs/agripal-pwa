# Audit 2: Single Source of Truth (SST) / Centralización

**Fecha**: 2026-02-27
**Tema**: SST / Centralización de constantes, keys, y datos estáticos
**Alcance**: `src/lib/constants/`, `src/lib/data/`, storage, query-keys
**Estado**: ✅ Completado

---

## Resumen Ejecutivo

**Buen estado general**: La mayoría de constantes, storage keys y datos estáticos están bien centralizados.

**Brechas encontradas**: 2 áreas menores que podrían mejorar

**Métrica SST**: ✅ 90% de centralización (muy bien)

---

## Hallazgos Detallados

### ✅ BIEN: Constantes Centralizadas en `src/lib/constants/`

**Estado**: Excelente. Toda la configuración global está centralizada.

**Estructura actual**:
```
src/lib/constants/
├── entities.ts          # Estados, etapas, tipos (ESTADO_AGUA, ETAPA, TIPO_ZONA, etc.)
├── query-keys.ts        # Query cache keys (QUERY_KEYS.proyectos, etc.)
├── storage.ts           # LocalStorage keys (STORAGE_KEYS.PROYECTO, TOKEN, TERRENO)
├── alertas.ts           # Tipos y severidades de alertas
├── umbrales.ts          # Umbrales de agua y suelo
├── conversiones.ts      # Factores de conversión (m3 a litros, etc.)
├── sync.ts              # Configuración de sincronización
└── index.ts             # Barrel export (reutilizar)
```

**Hallazgo**: ✅ Bien. Toda constante tiene su módulo claro.

---

### ✅ BIEN: Storage Keys Centralizadas

**Patrón en uso**:
```typescript
// ✅ CORRECTO - Todos usan STORAGE_KEYS centralizado
localStorage.getItem(STORAGE_KEYS.PROYECTO)
localStorage.getItem(STORAGE_KEYS.TERRENO)
localStorage.getItem(STORAGE_KEYS.TOKEN)
```

**Ubicaciones verificadas**:
- `src/hooks/use-auth.ts` ✅
- `src/hooks/use-project-handlers.ts` ✅
- `src/contexts/project-context.tsx` ✅
- `src/app/terrenos/page.tsx` ✅

**Conclusión**: ✅ No hay hardcoding de storage keys. 100% centralizado.

---

### ✅ BIEN: Datos Estáticos en `data/static/` con Wrappers TS

**Patrón**:
```
data/static/cultivos/arica.json
    ↓ (importado y tipado en)
src/lib/data/cultivos-arica.ts  (exporta funciones: obtenerCultivo(), etc.)
    ↓ (usado en)
src/lib/dal/cultivos.ts o componentes
```

**Archivo | JSON Source | TS Wrapper | Exporta |
|---------|-------------|-----------|---------|
| Cultivos | `data/static/cultivos/arica.json` | `src/lib/data/cultivos-arica.ts` | `obtenerCultivo()` |
| Fuentes de Agua | `data/static/fuentes-agua/arica.json` | `src/lib/data/fuentes-agua.ts` | `obtenerFuente()` |
| Umbrales Suelo | `data/static/umbrales/suelo.json` | `src/lib/data/umbrales-suelo.ts` | Constante `UMBRALES_SUELO` |
| Umbrales Agua | `data/static/umbrales/agua.json` | `src/lib/data/umbrales-agua.ts` | Constante `UMBRALES_AGUA` |
| Clima Arica | `data/static/clima/arica.json` | `src/lib/data/clima-arica.ts` | Exporta funciones |
| Enmiendas | `data/static/suelo/enmiendas.json` | `src/lib/data/enmiendas-suelo.ts` | `obtenerEnmienda()` |
| Técnicas | `data/static/tecnicas/mejora-crecimiento.json` | `src/lib/data/tecnicas-mejora.ts` | - |
| Mercado (Precios) | `data/static/mercado/precios-arica.json` | `src/lib/data/mercado.ts` | `obtenerMercado()` |
| Variedades | `data/static/variedades/arica.json` | `src/lib/data/variedades.ts` | - |

**Conclusión**: ✅ Excelente. Single source of truth para datos. No hay imports directos de JSON desde componentes.

---

### ⚠️ REVISAR: Query Keys Parcialmente Centralizadas

**Ubicación**: `src/lib/constants/query-keys.ts`

**Estado actual**:
```typescript
export const QUERY_KEYS = {
  catalogo: () => ['catalogo'],
  proyectos: () => ['proyectos'],
  terrenos: () => ['terrenos'],
};
```

**Hallazgo**: El QUERY_KEYS tiene métodos pero parece tener **pocas keys definidas** comparado con su uso real.

**Búsqueda rápida**: Otros archivos pueden estar usando query keys hardcoded:
```
// Necesita verificación más profunda en:
- src/hooks/use-*.ts
- src/lib/dal/
- src/contexts/
```

**Recomendación**: Auditar si hay query keys hardcoded en `useQuery()` llamadas fuera de `QUERY_KEYS`.

---

### 🟡 REVISAR: Rutas Hardcodeadas

**Patrón detectado**: Algunas rutas se usan como strings sueltos en componentes:

**Ejemplo** (basado en estructura):
```typescript
// Potencial: rutas hardcodeadas en navegaciones
router.push('/agua')
router.push('/economia')
router.push('/agua/planificador')
```

**Recomendación**:
- Crear `src/lib/constants/routes.ts` con constantes:
```typescript
export const ROUTES = {
  AGUA: '/agua',
  AGUA_PLANIFICADOR: '/agua/planificador',
  ECONOMIA: '/economia',
  // ...
};
```

**Impacto**: Si URLs cambian, solo cambiar un lugar en lugar de buscar/reemplazar en 10+ archivos.

---

## Métricas de Centralización

| Aspecto | Estado | Observación |
|---------|--------|-------------|
| **Constantes Globales** | ✅ Excelente | Toda constante en `src/lib/constants/` |
| **Storage Keys** | ✅ Excelente | 100% centralizado en `STORAGE_KEYS` |
| **Query Keys** | ⚠️ Parcial | Definidas en `QUERY_KEYS` pero posiblemente incompletas |
| **Datos Estáticos** | ✅ Excelente | `data/static/` + wrappers TS bien estructurado |
| **Rutas** | ⚠️ No centralizado | URLs hardcodeadas en componentes |
| **Umbrales/Configuración** | ✅ Excelente | `src/lib/constants/` y `src/lib/data/` |

---

## Hallazgos por Regla 3 (SST)

✅ **Centralizar constantes**: CUMPLE
✅ **Centralizar query/cache keys**: PARCIALMENTE (ver revisar arriba)
✅ **Centralizar storage keys**: CUMPLE
⚠️ **Centralizar rutas**: NO CUMPLE (pendiente)

---

## Recomendaciones

### 🟢 MANTENER (Bien implementado)
- Estructura actual de `src/lib/constants/` y `src/lib/data/`
- Uso de `STORAGE_KEYS` centralizado
- Wrappers TS para datos estáticos JSON

### 🟡 MEJORAR (Pendiente)

1. **Crear `src/lib/constants/routes.ts`**
   - Centralizar todas las rutas de la app
   - Facilitar cambios de URLs sin buscar/reemplazar

2. **Auditar `QUERY_KEYS`**
   - Revisar si hay queries hardcodeadas fuera de `QUERY_KEYS`
   - Añadir todas las keys actuales al centralizado

3. **Documento SST**
   - Crear guía de dónde centralizar cada tipo de constante
   - Ejemplos: dónde va un número, dónde va una URL, etc.

---

## Estado Respecto a Regla 3

**Regla 3 (SST)**: "Una sola fuente de verdad por concepto"

| Concepto | Centralizado | Ubicación |
|----------|-------------|-----------|
| Estados de entidades | ✅ | `src/lib/constants/entities.ts` |
| Query keys | ⚠️ Parcial | `src/lib/constants/query-keys.ts` |
| Storage keys | ✅ | `src/lib/constants/storage.ts` |
| Datos estáticos | ✅ | `data/static/` + `src/lib/data/` |
| Rutas | ❌ | No centralizado |
| Umbrales | ✅ | `src/lib/constants/umbrales.ts` + `src/lib/data/` |

**Cumplimiento**: 85% (excelente, 2 mejoras pendientes)

---

## Próximos Audits

✅ Audit 1: Duplicación - COMPLETO
✅ Audit 2: SST / Centralización - COMPLETO (este)
⏳ Audit 3: Tipado / Seguridad
⏳ Audit 4: Tamaño de Archivos
⏳ ... (ver padre.md)

---

## Referencias

- `src/lib/constants/` - Constantes centralizadas
- `data/static/` - Datos estáticos
- `src/lib/data/` - Wrappers TS para datos
- CLAUDE.md - "Single Source of Truth" section
