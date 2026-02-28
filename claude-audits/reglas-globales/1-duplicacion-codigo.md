# Audit 1: Duplicación de Código (DRY)

**Fecha**: 2026-02-27
**Tema**: DRY / Eliminación de Duplicación
**Alcance**: `src/lib/utils/`, `src/components/`, `src/hooks/`
**Estado**: ✅ Completado

---

## Resumen Ejecutivo

Se identificaron **3 patrones principales de duplicación**:

1. **parseFloat/parseInt pattern** - Repetido 15+ veces (⚠️ crítico)
2. **typeof navigator !== 'undefined'** - Repetido 4+ veces (⚠️ importante)
3. **Funciones de consumo de agua** - 5 variantes potencialmente duplicadas (⚠️ revisar)

**Brechas respecto a Regla 4 (DRY)**: 3 brechas críticas, 2 importantes

---

## Hallazgos Detallados

### 1. ❌ parseFloat/parseInt Pattern (CRÍTICO)

**Patrón problemático**: `parseInt(value) || undefined` y `parseFloat(value) || undefined`

Este patrón **discard zero y otros valores falsy válidos**. Según MEMORY.md, el bug correcto es:
```typescript
// ❌ INCORRECTO (discard 0)
const valor = parseFloat(str) || undefined;

// ✅ CORRECTO
const valor = str === '' ? undefined : parseFloat(str);
```

**Ubicaciones encontradas** (15+ instancias):

| Archivo | Línea | Patrón | Frecuencia |
|---------|-------|--------|-----------|
| `src/components/agua/proveedor-form.tsx` | 52 | `parseInt(...) \|\| undefined` | 1x |
| `src/components/agua/formulario-calidad-agua.tsx` | 133 | `parseFloat(...) \|\| undefined` | 3x |
| `src/components/terreno/tab-legal-secciones.tsx` | 48, 154 | `parseFloat/parseInt(...) \|\| undefined` | 2x |
| `src/components/agua/configurar-agua-modal.tsx` | 41 | `costoRecarga \|\| undefined` | 1x |
| `src/components/agua/entrada-agua-form.tsx` | 50–51 | `costo \|\| undefined, proveedor \|\| undefined` | 2x |

**Solución sugerida**:
- Crear función centralizada `safeParseFloat()` y `safeParseInt()` en `src/lib/utils/`
- **NOTA**: `src/components/suelo/suelo-form-utils.ts` **YA TIENE** `safeParseFloat()` y `safeParseInt()` (líneas 21–30)
- **Duplicación**: Esta utilidad DEBE extraerse a `src/lib/utils/` y reutilizarse

---

### 2. ⚠️ typeof navigator !== 'undefined' Pattern (IMPORTANTE)

**Patrón**: Verificación de SSR/browser environment repetida

**Ubicaciones**:
- `src/hooks/use-online-status.ts` : línea 7
- `src/hooks/use-sync.ts` : líneas 30, 41
- `src/lib/sync/engine.ts` : línea 79
- `src/lib/events/zona-events.ts` : líneas 4, 10

**Duplicación**: 4+ repeticiones del mismo patrón

**Solución sugerida**:
- Crear helper `src/lib/utils/ssr.ts`:
```typescript
export const isBrowser = () => typeof navigator !== 'undefined';
export const isServer = () => typeof navigator === 'undefined';
```
- Centralizar en `src/lib/constants/` o `src/lib/utils/`

**Impacto**: Código más limpio, fácil de testear/mockear en tests

---

### 3. ⚠️ Funciones de Consumo de Agua (REVISAR)

**Potencial duplicación** en `src/lib/utils/agua.ts`:

| Función | Propósito | Potencial Overlap |
|---------|-----------|-------------------|
| `calcularConsumoPlanta` | Por una planta | ✓ |
| `calcularConsumoRiegoZona` | Total riego zona | ✓ |
| `calcularConsumoZona` | Total zona | ✓ |
| `calcularConsumoTerreno` | Total terreno | ✓ |
| `calcularConsumoRealTerreno` | Consumo real con descuentos | ✓ |

**Recomendación**: Revisar si hay lógica duplicada o si cada una tiene un propósito claro y diferenciado.

---

### 4. ✅ Constantes Centralizadas - BIEN

**Buen patrón** en `src/lib/constants/`:
- `query-keys.ts` - Query keys centralizadas
- `alertas.ts` - Tipos de alertas
- `entities.ts` - IDs de entidades
- `umbrales.ts` - Umbrales de agua, suelo
- `conversiones.ts` - Factores de conversión
- `storage.ts` - Storage keys

**Estado**: ✅ Bien organizado, no hay duplicación evidente

---

## Recomendaciones por Severidad

### 🔴 CRÍTICO (Debe arreglarse)

1. **Extraer `safeParseFloat/safeParseInt` a `src/lib/utils/`**
   - Actualmente duplicado en `src/components/suelo/suelo-form-utils.ts`
   - Reemplazar 15+ instancias de `parseFloat(...) || undefined` en toda la codebase
   - Ubicación centralizada para reutilización

### 🟠 IMPORTANTE (Debería arreglarse pronto)

2. **Crear `src/lib/utils/ssr.ts` o agregar a `src/lib/utils/index.ts`**
   - Centralizar verificación `typeof navigator !== 'undefined'`
   - 4+ ubicaciones donde se repite
   - Mejora testabilidad

### 🟡 TÉCNICO (Revisar, quizás no necesite cambios)

3. **Auditar funciones de consumo de agua**
   - Verificar si `calcularConsumoPlanta`, `calcularConsumoZona`, etc. tienen propósitos distintos
   - Si hay duplicación real, refactorizar a función base + variantes

---

## Métrica DRY

| Métrica | Estado | Observación |
|---------|--------|-------------|
| **Duplicación de Funciones Utilitarias** | ⚠️ Medio | 1 función (safeParseFloat/Int) duplicada |
| **Duplicación de Patrones SSR** | ⚠️ Medio | 4+ instancias del mismo patrón |
| **Duplicación de Componentes** | ✅ Bien | No se detectó duplicación evidente |
| **Hardcoding de Strings/Números** | ✅ Bien | Constantes bien centralizadas |

---

## Próximos Pasos

1. ✅ Este audit completado
2. ⏳ Audit 2: SST / Centralización
3. ⏳ Audit 3: Tipado / Seguridad
4. ⏳ ... (ver padre.md)

---

## Referencias

- [MEMORY.md](../../.claude/projects/...-agriplan-pwa/memory/MEMORY.md) - Bug patterns section: parseFloat issue
- `src/components/suelo/suelo-form-utils.ts` - Contiene las utilidades a centralizar
- DRY Principle: If something is repeated 2–3+ veces, debe ser un helper
