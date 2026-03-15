# Supabase — Base de Datos AgriPlan

## Setup inicial (BD nueva desde cero)

```bash
# 1. Aplicar todas las migraciones
pnpm db:push

# 2. Poblar tablas base globales (cultivos, clima, insumos, etc.)
pnpm seed:base

# 3. Restaurar datos de un usuario especifico (opcional)
#    Requiere SEED_USER_EMAIL en .env.local
pnpm seed
```

## Cuando agregas una migracion nueva

1. Crea el archivo en `supabase/migrations/` con el siguiente numero (ej: `006_nombre.sql`)
2. Aplica en remoto:

```bash
pnpm db:push
```

## Cuando modificas datos base (data/seed/\*.json)

Si agregaste o cambiaste algun JSON en `data/seed/`, vuelve a correr:

```bash
pnpm seed:base
```

El script usa `upsert` — no duplica, solo actualiza lo que cambio.

## Cuando hay migraciones remotas no reconocidas localmente

Ocurre si alguien aplico cambios directo en el dashboard de Supabase.

```bash
# Ver estado actual
npx supabase migration list

# Marcar la migracion remota como revertida para desbloquear
npx supabase migration repair --status reverted <timestamp>

# Luego aplicar normalmente
pnpm db:push
```

## Variables requeridas en .env.local

```env
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...   # para seed y migraciones
SEED_USER_EMAIL=...             # para pnpm seed
```

## Estructura de carpetas relevante

```
supabase/
  migrations/
    001_initial_schema.sql      — tablas principales + RLS
    002_zona_estanque_id.sql    — relacion zona-estanque
    003_billing_schema.sql      — planes, suscripciones, pagos
    004_catalogo_base.sql       — catalogo_base + variedades_base + trigger copia
    005_datos_base.sql          — insumos, enmiendas, tecnicas, clima, fuentes agua, precios

data/
  seed/                         — JSONs que se suben via pnpm seed:base
  static/                       — constantes del sistema (umbrales)
  pendiente/                    — JSONs sin rol definido aun
  feedback-stakeholder/         — planos y referencias del terreno piloto
```
