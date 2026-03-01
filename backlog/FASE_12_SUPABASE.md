# FASE 12: Supabase — Base de datos + Infraestructura

**Status**: ⏳ PENDIENTE
**Prioridad**: 🔴 CRÍTICA
**Dependencias**: FASE_11
**Estimación**: 4-5 horas
**Última revisión**: 2026-03-01

---

## Estado Real del Código (auditado 2026-03-01)

| Aspecto                             | Estado                                                     |
| ----------------------------------- | ---------------------------------------------------------- |
| `@supabase/supabase-js`             | ❌ NO instalado                                            |
| `@supabase/ssr`                     | ❌ NO instalado                                            |
| `src/lib/supabase/`                 | ❌ NO existe                                               |
| `src/lib/sync/adapters/supabase.ts` | ❌ NO existe — solo MockAdapter                            |
| `supabase/migrations/`              | ❌ NO existe                                               |
| `src/lib/db/index.ts`               | ✅ Dexie v4 schema v1+v2 completo                          |
| `src/lib/sync/engine.ts`            | ✅ Motor de sync con cola implementado                     |
| `src/lib/sync/types.ts`             | ✅ Interfaces `SyncAdapter`, `SyncRequest`, `SyncResponse` |
| `src/hooks/use-sync.ts`             | ✅ Hook con intervalo 30s, reintentos, conflictos          |
| `src/lib/constants/sync.ts`         | ✅ `SYNC_ENTIDADES` con 7 entidades definidas              |

**Resumen**: La arquitectura de sync (cola, engine, tipos) está completa. Solo falta conectarla a Supabase real.

---

## Objetivo

Conectar la app a Supabase para que los datos de cada usuario (terrenos, zonas, plantas, agua, etc.) se guarden en PostgreSQL y se sincronicen entre dispositivos, manteniendo el comportamiento offline-first con IndexedDB como caché local.

**Visión de arquitectura:**

```
WRITE (con red):
  Usuario edita → IndexedDB (inmediato, optimista) → cola sync → Supabase PostgreSQL

WRITE (sin red):
  Usuario edita → IndexedDB → cola pendiente (se envía cuando vuelve la red)

READ (siempre):
  IndexedDB local → instantáneo, sin red

SYNC (al reconectar):
  Cola pendiente → push a Supabase → pull cambios remotos → actualiza IndexedDB
```

**Entregables:**

1. Instalar `@supabase/supabase-js` + `@supabase/ssr`
2. Crear clientes Supabase (browser + middleware)
3. Schema PostgreSQL con RLS
4. `SupabaseAdapter` que reemplaza `MockAdapter`
5. Tipos TypeScript generados desde el schema

**NO en esta fase:**

- ~~Script de migración de datos existentes~~ → no hay datos de producción aún
- ~~Página `/migrate`~~ → innecesario
- ~~`supabaseAdmin` / `SERVICE_ROLE_KEY`~~ → solo necesario para webhooks de billing (FASE_14)

**Decisión de conflictos sync**: Last-write-wins — el registro con `last_modified` más reciente reemplaza al otro. Sin intervención del usuario. Si en el futuro se desea resolución manual, existe `src/components/sync/conflict-modal.tsx` para ello.

---

## Tarea 1: Instalar dependencias

```bash
pnpm add @supabase/supabase-js @supabase/ssr
```

**NO instalar** `@supabase/auth-helpers-nextjs` — deprecated desde Supabase v2.

---

## Tarea 2: Variables de entorno

**Archivo**: `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

Solo estas dos para el funcionamiento normal de la app.
`SUPABASE_SERVICE_ROLE_KEY` se agrega en FASE_14 (billing webhooks).

---

## Tarea 3: Clientes Supabase

**Archivo**: `src/lib/supabase/client.ts` (browser — para hooks CSR)

```typescript
import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
```

**Archivo**: `src/lib/supabase/middleware.ts` (para proxy.ts)

```typescript
import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

export function createSupabaseMiddlewareClient(
  request: NextRequest,
  response: NextResponse,
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );
}
```

---

## Tarea 4: Schema PostgreSQL

**Archivo**: `supabase/migrations/001_initial_schema.sql`

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USUARIOS (espejo de Supabase Auth)
CREATE TABLE usuarios (
  id          UUID PRIMARY KEY,  -- mismo id que auth.users
  email       TEXT UNIQUE NOT NULL,
  nombre      TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- PROYECTOS
CREATE TABLE proyectos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id    UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre        TEXT NOT NULL,
  descripcion   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  last_modified TIMESTAMPTZ DEFAULT NOW()
);

-- TERRENOS
CREATE TABLE terrenos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proyecto_id     UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  nombre          TEXT NOT NULL,
  ancho_m         FLOAT NOT NULL,
  alto_m          FLOAT NOT NULL,
  area_m2         FLOAT,
  suelo           JSONB,
  ubicacion       JSONB,
  legal           JSONB,
  infraestructura JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  last_modified   TIMESTAMPTZ DEFAULT NOW()
);

-- ZONAS
CREATE TABLE zonas (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  terreno_id       UUID NOT NULL REFERENCES terrenos(id) ON DELETE CASCADE,
  nombre           TEXT NOT NULL,
  tipo             TEXT NOT NULL,
  x                FLOAT NOT NULL,
  y                FLOAT NOT NULL,
  ancho            FLOAT NOT NULL,
  alto             FLOAT NOT NULL,
  color            TEXT,
  area_m2          FLOAT,
  estanque_config  JSONB,
  configuracion_riego JSONB,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  last_modified    TIMESTAMPTZ DEFAULT NOW()
);

-- PLANTAS
CREATE TABLE plantas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zona_id         UUID NOT NULL REFERENCES zonas(id) ON DELETE CASCADE,
  tipo_cultivo_id UUID NOT NULL,
  x               FLOAT NOT NULL,
  y               FLOAT NOT NULL,
  fecha_plantacion TIMESTAMPTZ,
  estado          TEXT DEFAULT 'plantada',
  etapa           TEXT,
  notas           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  last_modified   TIMESTAMPTZ DEFAULT NOW()
);

-- CATÁLOGO CULTIVOS (personalizable por proyecto)
CREATE TABLE catalogo_cultivos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proyecto_id     UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  nombre          TEXT NOT NULL,
  nombre_cientifico TEXT,
  tier            TEXT,
  espaciado_m     FLOAT,
  agua_m3_ha_año  FLOAT,
  dias_cosecha    INT,
  color           TEXT,
  precio_semilla_clp FLOAT,
  precio_kg_clp   FLOAT,
  kg_por_planta_año FLOAT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ENTRADAS AGUA
CREATE TABLE entradas_agua (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  terreno_id      UUID NOT NULL REFERENCES terrenos(id) ON DELETE CASCADE,
  tipo            TEXT NOT NULL,
  cantidad_m3     FLOAT NOT NULL,
  fecha           TIMESTAMPTZ DEFAULT NOW(),
  costo_clp       FLOAT,
  estanque_id     UUID REFERENCES zonas(id),
  fuente          JSONB,
  notas           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  last_modified   TIMESTAMPTZ DEFAULT NOW()
);

-- COSECHAS
CREATE TABLE cosechas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zona_id         UUID NOT NULL REFERENCES zonas(id) ON DELETE CASCADE,
  tipo_cultivo_id UUID NOT NULL,
  cantidad_kg     FLOAT NOT NULL,
  fecha           TIMESTAMPTZ DEFAULT NOW(),
  precio_venta_kg FLOAT,
  notas           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  last_modified   TIMESTAMPTZ DEFAULT NOW()
);

-- ALERTAS
CREATE TABLE alertas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  terreno_id      UUID NOT NULL REFERENCES terrenos(id) ON DELETE CASCADE,
  tipo            TEXT NOT NULL,
  severidad       TEXT NOT NULL,
  estado          TEXT DEFAULT 'activa',
  titulo          TEXT NOT NULL,
  mensaje         TEXT NOT NULL,
  zona_id         UUID REFERENCES zonas(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  last_modified   TIMESTAMPTZ DEFAULT NOW()
);

-- TRIGGER: updated_at automático
-- Necesario para que el sync sepa qué cambió y cuándo (delta sync por last_modified)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_modified = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_proyectos_updated_at     BEFORE UPDATE ON proyectos     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_terrenos_updated_at      BEFORE UPDATE ON terrenos      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_zonas_updated_at         BEFORE UPDATE ON zonas         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_plantas_updated_at       BEFORE UPDATE ON plantas       FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_entradas_agua_updated_at BEFORE UPDATE ON entradas_agua FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_cosechas_updated_at      BEFORE UPDATE ON cosechas      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_alertas_updated_at       BEFORE UPDATE ON alertas       FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

## Tarea 5: Row Level Security (RLS)

RLS garantiza que cada usuario solo pueda ver y modificar SUS propios datos, aunque estén en la misma base de datos. Sin esto, cualquier usuario autenticado podría leer los terrenos de otro.

**Archivo**: `supabase/migrations/002_rls_policies.sql`

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE usuarios          ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyectos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE terrenos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE zonas             ENABLE ROW LEVEL SECURITY;
ALTER TABLE plantas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogo_cultivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE entradas_agua     ENABLE ROW LEVEL SECURITY;
ALTER TABLE cosechas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas           ENABLE ROW LEVEL SECURITY;

-- USUARIOS: solo ver/editar el propio perfil
CREATE POLICY "usuario_own" ON usuarios
  USING (auth.uid() = id);

-- PROYECTOS: solo los del usuario autenticado
CREATE POLICY "proyectos_own" ON proyectos
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

-- TERRENOS: solo los de proyectos del usuario
CREATE POLICY "terrenos_own" ON terrenos
  USING (proyecto_id IN (SELECT id FROM proyectos WHERE usuario_id = auth.uid()))
  WITH CHECK (proyecto_id IN (SELECT id FROM proyectos WHERE usuario_id = auth.uid()));

-- ZONAS: solo las de terrenos del usuario
CREATE POLICY "zonas_own" ON zonas
  USING (terreno_id IN (
    SELECT t.id FROM terrenos t
    JOIN proyectos p ON t.proyecto_id = p.id
    WHERE p.usuario_id = auth.uid()
  ));

-- PLANTAS: solo las de zonas del usuario
CREATE POLICY "plantas_own" ON plantas
  USING (zona_id IN (
    SELECT z.id FROM zonas z
    JOIN terrenos t ON z.terreno_id = t.id
    JOIN proyectos p ON t.proyecto_id = p.id
    WHERE p.usuario_id = auth.uid()
  ));

-- CATÁLOGO: solo el del usuario
CREATE POLICY "catalogo_own" ON catalogo_cultivos
  USING (proyecto_id IN (SELECT id FROM proyectos WHERE usuario_id = auth.uid()))
  WITH CHECK (proyecto_id IN (SELECT id FROM proyectos WHERE usuario_id = auth.uid()));

-- ENTRADAS AGUA: solo las del usuario
CREATE POLICY "entradas_agua_own" ON entradas_agua
  USING (terreno_id IN (
    SELECT t.id FROM terrenos t
    JOIN proyectos p ON t.proyecto_id = p.id
    WHERE p.usuario_id = auth.uid()
  ));

-- COSECHAS: solo las del usuario
CREATE POLICY "cosechas_own" ON cosechas
  USING (zona_id IN (
    SELECT z.id FROM zonas z
    JOIN terrenos t ON z.terreno_id = t.id
    JOIN proyectos p ON t.proyecto_id = p.id
    WHERE p.usuario_id = auth.uid()
  ));

-- ALERTAS: solo las del usuario
CREATE POLICY "alertas_own" ON alertas
  USING (terreno_id IN (
    SELECT t.id FROM terrenos t
    JOIN proyectos p ON t.proyecto_id = p.id
    WHERE p.usuario_id = auth.uid()
  ));
```

---

## Tarea 6: SupabaseAdapter

Reemplaza `MockAdapter`. Implementa la interfaz `SyncAdapter` que ya existe en `src/lib/sync/types.ts`.

**Archivo**: `src/lib/sync/adapters/supabase.ts`

```typescript
import { supabase } from "@/lib/supabase/client";
import { getCurrentTimestamp } from "@/lib/utils";
import { logger } from "@/lib/logger";
import type {
  SyncAdapter,
  SyncRequest,
  SyncResponse,
  PullRequest,
  PullResponse,
} from "../types";
import type { SyncEntidad } from "@/types";

const TABLE_MAP: Record<SyncEntidad, string> = {
  proyecto: "proyectos",
  terreno: "terrenos",
  zona: "zonas",
  planta: "plantas",
  entrada_agua: "entradas_agua",
  cosecha: "cosechas",
  alerta: "alertas",
};

export class SupabaseAdapter implements SyncAdapter {
  async isAvailable(): Promise<boolean> {
    try {
      const { error } = await supabase.from("proyectos").select("id").limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  async push(request: SyncRequest): Promise<SyncResponse> {
    const table = TABLE_MAP[request.entidad];
    try {
      if (request.accion === "create") {
        const { data, error } = await supabase
          .from(table)
          .insert({ ...request.datos, id: request.entidadId })
          .select()
          .single();
        if (error) throw error;
        return { success: true, data: data as Record<string, unknown> };
      }

      if (request.accion === "update") {
        const { data, error } = await supabase
          .from(table)
          .update({ ...request.datos, last_modified: getCurrentTimestamp() })
          .eq("id", request.entidadId)
          .select()
          .single();
        if (error) {
          // Conflicto: alguien más modificó este registro
          if (error.code === "23505") {
            const { data: serverData } = await supabase
              .from(table)
              .select()
              .eq("id", request.entidadId)
              .single();
            return {
              success: false,
              conflict: true,
              serverData: serverData as Record<string, unknown>,
            };
          }
          throw error;
        }
        return { success: true, data: data as Record<string, unknown> };
      }

      if (request.accion === "delete") {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq("id", request.entidadId);
        if (error) throw error;
        return { success: true };
      }

      throw new Error(`Acción desconocida: ${request.accion}`);
    } catch (err) {
      logger.error("SupabaseAdapter.push", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Error desconocido",
      };
    }
  }

  async pull(request: PullRequest): Promise<PullResponse> {
    const table = TABLE_MAP[request.entidad];
    try {
      let query = supabase.from(table).select("*");
      if (request.since) {
        // Delta sync: solo trae registros modificados desde la última sincronización
        query = query.gt("last_modified", request.since);
      }
      const { data, error } = await query;
      if (error) throw error;
      return {
        success: true,
        data: (data ?? []) as Record<string, unknown>[],
        lastModified: getCurrentTimestamp(),
      };
    } catch (err) {
      logger.error("SupabaseAdapter.pull", err);
      return {
        success: false,
        data: [],
        error: err instanceof Error ? err.message : "Error desconocido",
      };
    }
  }
}

export const supabaseAdapter = new SupabaseAdapter();
```

---

## Tarea 7: Activar SupabaseAdapter en useSync

**Archivo**: `src/hooks/use-sync.ts` (modificar una línea)

```typescript
// Antes:
import { mockAdapter } from "@/lib/sync/adapters";
// ...
setAdapter(mockAdapter);

// Después:
import { supabaseAdapter } from "@/lib/sync/adapters/supabase";
// ...
setAdapter(supabaseAdapter);
```

---

## Tarea 8: Actualizar el barrel export de adapters

**Archivo**: `src/lib/sync/adapters/index.ts`

```typescript
export { MockAdapter, mockAdapter } from "./mock";
export { SupabaseAdapter, supabaseAdapter } from "./supabase";
```

---

## Criterios de Aceptación

- [ ] `pnpm add @supabase/supabase-js @supabase/ssr` ejecutado sin errores
- [ ] `.env.local` con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Migrations aplicadas en Supabase Dashboard (o via CLI)
- [ ] RLS activo — verificar que un usuario no puede leer datos de otro
- [ ] `SupabaseAdapter.isAvailable()` devuelve `true` con conexión
- [ ] Crear un proyecto en la app → aparece en Supabase Dashboard
- [ ] Modificar un terreno offline → cambio queda en cola → al reconectar se sincroniza
- [ ] `pnpm type-check` sin errores

---

## Siguiente fase

**FASE_13** — Autenticación real con Supabase Auth (login, registro, Google OAuth)
