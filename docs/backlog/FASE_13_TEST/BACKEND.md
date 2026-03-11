# FASE 13 — Tests Backend (Supabase Verification) [DEPRECADO]

> **DEPRECADO**: Este archivo fue reemplazado por specs individuales en `docs/tests/e2e/specs/TC-*.md`.
> Ver [`docs/tests/e2e/README.md`](../tests/e2e/README.md) para la estructura actualizada.

---

Guía original (conservada como referencia histórica):

Guía para verificar datos en Supabase después de cada test de browser.
Usa el script `scripts/verify-sync.ts` desde terminal.

---

## Setup

```bash
# Instalar tsx si no lo tienes
pnpm add -D tsx dotenv

# Verificar que funciona
npx tsx scripts/verify-sync.ts
```

---

## Comandos Disponibles

```bash
# Resumen de todas las tablas (conteo de registros)
npx tsx scripts/verify-sync.ts

# Detalle de una tabla específica
npx tsx scripts/verify-sync.ts --tabla proyectos
npx tsx scripts/verify-sync.ts --tabla terrenos
npx tsx scripts/verify-sync.ts --tabla zonas

# Buscar un registro por nombre
npx tsx scripts/verify-sync.ts --check "Test Sync 01"

# Verificar RLS (sin sesión activa = 0 registros)
npx tsx scripts/verify-sync.ts --rls
```

---

## Verificaciones por Test

### Después de TEST-B01 (Primera activación)

```bash
# 1. Verificar que las tablas tienen datos
npx tsx scripts/verify-sync.ts
# ESPERADO:
#   ✅ proyectos              1 registros
#   ✅ terrenos               1 registros
#   ✅ zonas                  2 registros
#   ✅ catalogo_cultivos     21+ registros

# 2. Verificar el proyecto por nombre
npx tsx scripts/verify-sync.ts --check "Test Sync 01"
# ESPERADO: ✅ proyectos  id: xxxxxxxx...  nombre: Test Sync 01

# 3. Verificar que usuario_id es UUID válido
npx tsx scripts/verify-sync.ts --tabla proyectos
# ESPERADO: usuario: xxxxxxxx... (NO "usuario-demo" ni "sin-sesion")
```

### Después de TEST-B02 (Restaurar desde nube)

```bash
# Verificar que los datos siguen intactos en Supabase
npx tsx scripts/verify-sync.ts
# ESPERADO: mismos conteos que TEST-B01 (datos no se borraron)
```

### Después de TEST-B03 (Offline sin sync)

```bash
# Verificar que "Proyecto Offline" NO subió
npx tsx scripts/verify-sync.ts --check "Proyecto Offline"
# ESPERADO: ❌ No encontrado en ninguna tabla
```

### Después de TEST-B04 paso 3 (Create)

```bash
npx tsx scripts/verify-sync.ts --check "Terreno CRUD"
# ESPERADO: ✅ terrenos  nombre: Terreno CRUD

npx tsx scripts/verify-sync.ts --check "Zona Tomates"
# ESPERADO: ✅ zonas  nombre: Zona Tomates
```

### Después de TEST-B04 paso 5 (Update)

```bash
npx tsx scripts/verify-sync.ts --check "Terreno CRUD Editado"
# ESPERADO: ✅ terrenos  nombre: Terreno CRUD Editado

npx tsx scripts/verify-sync.ts --check "Terreno CRUD"
# ESPERADO: ❌ No encontrado (nombre cambió)
```

### Después de TEST-B04 paso 7 (Delete)

```bash
npx tsx scripts/verify-sync.ts --check "Zona Tomates"
# ESPERADO: ❌ No encontrado (fue eliminada)
```

### Después de TEST-B05 (Reconexión)

```bash
npx tsx scripts/verify-sync.ts --check "Proyecto Sin Red"
# ESPERADO: ✅ proyectos  nombre: Proyecto Sin Red

npx tsx scripts/verify-sync.ts --check "Terreno Offline"
# ESPERADO: ✅ terrenos  nombre: Terreno Offline
```

### TEST-B06 (RLS)

```bash
# Sin sesión activa, no debería verse nada
npx tsx scripts/verify-sync.ts --rls
# ESPERADO: ✅ RLS ACTIVO — 0 registros visibles sin sesión
```

### Después de TEST-B07 (Desactivar sync)

```bash
npx tsx scripts/verify-sync.ts --check "Post Desactivar"
# ESPERADO: ❌ No encontrado (sync estaba OFF)
```

### Después de TEST-B08 (Reactivar sync)

```bash
npx tsx scripts/verify-sync.ts --check "Post Desactivar"
# ESPERADO: ✅ terrenos  nombre: Post Desactivar

# Verificar que no hay duplicados
npx tsx scripts/verify-sync.ts --tabla terrenos
# ESPERADO: cada terreno aparece UNA sola vez
```

---

## Verificación Completa (ejecutar después de todos los tests)

```bash
# Resumen final
npx tsx scripts/verify-sync.ts

# RLS
npx tsx scripts/verify-sync.ts --rls

# Detalle de cada tabla
npx tsx scripts/verify-sync.ts --tabla proyectos
npx tsx scripts/verify-sync.ts --tabla terrenos
npx tsx scripts/verify-sync.ts --tabla zonas
```
