# FASE 12: Migración a Supabase (Backend Real)

**Status**: ⏳ PENDIENTE
**Prioridad**: 🔴 CRÍTICA
**Dependencias**: FASE_11
**Estimación**: 5-6 horas

---

## Objetivo

Migrar la aplicación de arquitectura 100% offline-first local a un sistema híbrido con backend real usando Supabase.

**Entregables:**
1. Base de datos PostgreSQL en Supabase con schema completo
2. Row Level Security (RLS) para multi-tenancy
3. API real reemplazando MockAdapter
4. Migración de datos de IndexedDB a Supabase
5. Sync bidireccional funcional

---

## Contexto Técnico

### Estado Actual
- **Backend:** ❌ No existe
- **DB:** IndexedDB (Dexie.js) solo local
- **Sync:** MockAdapter (simula sincronización)
- **Auth:** JWT mock sin validación real

### Estado Deseado
- **Backend:** ✅ Supabase (PostgreSQL + API REST)
- **DB:** ✅ PostgreSQL en la nube + IndexedDB local
- **Sync:** ✅ SupabaseAdapter real
- **Auth:** ✅ Supabase Auth (FASE_13)

---

## Arquitectura Objetivo

```
┌─────────────────┐
│  Usuario (PWA)  │
└────────┬────────┘
         │
    ┌────▼─────┐
    │ Next.js  │
    │ Frontend │
    └────┬─────┘
         │
    ┌────▼─────────────────┐
    │ Supabase Client SDK  │
    └────┬─────────────────┘
         │
    ┌────▼─────────────────┐
    │   Supabase Cloud     │
    ├──────────────────────┤
    │ PostgreSQL Database  │
    │ Row Level Security   │
    │ Realtime             │
    │ Storage              │
    └──────────────────────┘
```

**Flujo de datos:**
```
1. Usuario modifica datos → IndexedDB (optimistic)
2. Cambio se agrega a sync_queue
3. useSync dispara cada 30s
4. SupabaseAdapter push → Supabase PostgreSQL
5. Pull delta sync (since=lastSyncAt)
6. IndexedDB se actualiza con cambios remotos
```

---

## Tareas

### Tarea 1: Configurar Proyecto Supabase

**Pasos:**

1. Crear cuenta en https://supabase.com
2. Crear nuevo proyecto:
   - Nombre: `agriplan-pwa`
   - Región: `South America (São Paulo)` (más cercano a Chile)
   - Password de DB: Generar segura
3. Copiar credenciales:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (solo backend)

**Archivo**: `.env.local` (crear/actualizar)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# JWT (ya no usar mock)
JWT_SECRET=agriplan_prod_secret_change_this
```

**Instalar dependencias:**

```bash
pnpm add @supabase/supabase-js @supabase/auth-helpers-nextjs
pnpm add -D @supabase/cli
```

---

### Tarea 2: Crear Schema PostgreSQL

**Archivo**: `supabase/migrations/20260204_initial_schema.sql` (crear)

```sql
-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USUARIOS
-- ============================================
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX usuarios_email_idx ON usuarios(email);

-- ============================================
-- PROYECTOS
-- ============================================
CREATE TABLE proyectos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_modified TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX proyectos_usuario_id_idx ON proyectos(usuario_id);

-- ============================================
-- TERRENOS
-- ============================================
CREATE TABLE terrenos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  ancho FLOAT NOT NULL,
  alto FLOAT NOT NULL,
  ubicacion_direccion TEXT,
  ubicacion_lat FLOAT,
  ubicacion_lng FLOAT,
  legal_rol TEXT,
  legal_inscripcion_sag TEXT,
  legal_derechos_agua TEXT,
  accesibilidad_vehicular BOOLEAN DEFAULT false,
  conectividad_electrica BOOLEAN DEFAULT false,
  conectividad_agua BOOLEAN DEFAULT false,
  conectividad_internet BOOLEAN DEFAULT false,
  distancia_ciudad FLOAT,
  distancia_mercado FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_modified TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX terrenos_proyecto_id_idx ON terrenos(proyecto_id);

-- ============================================
-- ZONAS
-- ============================================
CREATE TYPE tipo_zona AS ENUM (
  'cultivo',
  'bodega',
  'casa',
  'camino',
  'decoracion',
  'estanque'
);

CREATE TABLE zonas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  terreno_id UUID NOT NULL REFERENCES terrenos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  tipo tipo_zona NOT NULL,
  x FLOAT NOT NULL,
  y FLOAT NOT NULL,
  ancho FLOAT NOT NULL,
  alto FLOAT NOT NULL,
  color TEXT,
  capacidad_litros FLOAT,
  nivel_actual_litros FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_modified TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX zonas_terreno_id_idx ON zonas(terreno_id);
CREATE INDEX zonas_tipo_idx ON zonas(tipo);

-- ============================================
-- PLANTAS
-- ============================================
CREATE TYPE estado_planta AS ENUM (
  'plantada',
  'creciendo',
  'madura',
  'cosechada',
  'muerta'
);

CREATE TABLE plantas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zona_id UUID NOT NULL REFERENCES zonas(id) ON DELETE CASCADE,
  tipo_cultivo_id UUID NOT NULL,
  x FLOAT NOT NULL,
  y FLOAT NOT NULL,
  fecha_plantacion TIMESTAMPTZ DEFAULT NOW(),
  estado estado_planta DEFAULT 'plantada',
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_modified TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX plantas_zona_id_idx ON plantas(zona_id);
CREATE INDEX plantas_tipo_cultivo_id_idx ON plantas(tipo_cultivo_id);
CREATE INDEX plantas_estado_idx ON plantas(estado);

-- ============================================
-- CATÁLOGO CULTIVOS
-- ============================================
CREATE TYPE tier_cultivo AS ENUM ('basico', 'comun', 'rentable', 'premium');

CREATE TABLE catalogo_cultivos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  nombre_cientifico TEXT,
  tier tier_cultivo DEFAULT 'comun',
  espaciado FLOAT NOT NULL,
  agua_diaria FLOAT NOT NULL,
  dias_cosecha INT NOT NULL,
  color TEXT,
  precio_semilla FLOAT,
  precio_kg FLOAT,
  kg_por_planta FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX catalogo_cultivos_proyecto_id_idx ON catalogo_cultivos(proyecto_id);

-- ============================================
-- ENTRADAS AGUA
-- ============================================
CREATE TYPE tipo_entrada_agua AS ENUM (
  'lluvia',
  'riego',
  'pozo',
  'red',
  'camion',
  'otro'
);

CREATE TABLE entradas_agua (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  terreno_id UUID NOT NULL REFERENCES terrenos(id) ON DELETE CASCADE,
  tipo tipo_entrada_agua NOT NULL,
  cantidad_litros FLOAT NOT NULL,
  fecha TIMESTAMPTZ DEFAULT NOW(),
  costo FLOAT,
  estanque_id UUID REFERENCES zonas(id),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_modified TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX entradas_agua_terreno_id_idx ON entradas_agua(terreno_id);
CREATE INDEX entradas_agua_fecha_idx ON entradas_agua(fecha);

-- ============================================
-- COSECHAS
-- ============================================
CREATE TABLE cosechas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zona_id UUID NOT NULL REFERENCES zonas(id) ON DELETE CASCADE,
  tipo_cultivo_id UUID NOT NULL,
  cantidad_kg FLOAT NOT NULL,
  fecha TIMESTAMPTZ DEFAULT NOW(),
  calidad TEXT,
  precio_venta_kg FLOAT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_modified TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX cosechas_zona_id_idx ON cosechas(zona_id);
CREATE INDEX cosechas_fecha_idx ON cosechas(fecha);

-- ============================================
-- ALERTAS
-- ============================================
CREATE TYPE tipo_alerta AS ENUM (
  'agua_baja',
  'riego_pendiente',
  'cosecha_proxima',
  'clima_adverso',
  'suelo_problema',
  'plaga',
  'otro'
);

CREATE TYPE severidad_alerta AS ENUM ('baja', 'media', 'alta', 'critica');
CREATE TYPE estado_alerta AS ENUM ('activa', 'resuelta', 'descartada');

CREATE TABLE alertas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  terreno_id UUID NOT NULL REFERENCES terrenos(id) ON DELETE CASCADE,
  tipo tipo_alerta NOT NULL,
  severidad severidad_alerta NOT NULL,
  estado estado_alerta DEFAULT 'activa',
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  zona_id UUID REFERENCES zonas(id),
  accion_sugerida TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_modified TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX alertas_terreno_id_idx ON alertas(terreno_id);
CREATE INDEX alertas_estado_idx ON alertas(estado);
CREATE INDEX alertas_severidad_idx ON alertas(severidad);

-- ============================================
-- TRIGGERS: updated_at automático
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_modified = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_proyectos_updated_at BEFORE UPDATE ON proyectos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_terrenos_updated_at BEFORE UPDATE ON terrenos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_zonas_updated_at BEFORE UPDATE ON zonas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plantas_updated_at BEFORE UPDATE ON plantas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entradas_agua_updated_at BEFORE UPDATE ON entradas_agua
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cosechas_updated_at BEFORE UPDATE ON cosechas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alertas_updated_at BEFORE UPDATE ON alertas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Ejecutar migración:**

```bash
npx supabase db push
```

---

### Tarea 3: Configurar Row Level Security (RLS)

**Archivo**: `supabase/migrations/20260204_rls_policies.sql` (crear)

```sql
-- ============================================
-- RLS: Usuarios
-- ============================================
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver solo su propio perfil"
  ON usuarios FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden actualizar solo su propio perfil"
  ON usuarios FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- RLS: Proyectos
-- ============================================
ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven solo sus proyectos"
  ON proyectos FOR SELECT
  USING (usuario_id = auth.uid());

CREATE POLICY "Usuarios crean solo sus proyectos"
  ON proyectos FOR INSERT
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Usuarios actualizan solo sus proyectos"
  ON proyectos FOR UPDATE
  USING (usuario_id = auth.uid());

CREATE POLICY "Usuarios eliminan solo sus proyectos"
  ON proyectos FOR DELETE
  USING (usuario_id = auth.uid());

-- ============================================
-- RLS: Terrenos
-- ============================================
ALTER TABLE terrenos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven solo terrenos de sus proyectos"
  ON terrenos FOR SELECT
  USING (
    proyecto_id IN (
      SELECT id FROM proyectos WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios crean terrenos en sus proyectos"
  ON terrenos FOR INSERT
  WITH CHECK (
    proyecto_id IN (
      SELECT id FROM proyectos WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios actualizan terrenos de sus proyectos"
  ON terrenos FOR UPDATE
  USING (
    proyecto_id IN (
      SELECT id FROM proyectos WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios eliminan terrenos de sus proyectos"
  ON terrenos FOR DELETE
  USING (
    proyecto_id IN (
      SELECT id FROM proyectos WHERE usuario_id = auth.uid()
    )
  );

-- ============================================
-- RLS: Zonas, Plantas, Entradas Agua, Cosechas, Alertas
-- Similar pattern: verificar que pertenecen a terrenos del usuario
-- ============================================

ALTER TABLE zonas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven solo zonas de sus terrenos"
  ON zonas FOR SELECT
  USING (
    terreno_id IN (
      SELECT t.id FROM terrenos t
      JOIN proyectos p ON t.proyecto_id = p.id
      WHERE p.usuario_id = auth.uid()
    )
  );

-- [Similar policies para INSERT, UPDATE, DELETE]
-- [Similar políticas para plantas, entradas_agua, cosechas, alertas]

-- Catálogo cultivos (por proyecto)
ALTER TABLE catalogo_cultivos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven catálogo de sus proyectos"
  ON catalogo_cultivos FOR SELECT
  USING (
    proyecto_id IN (
      SELECT id FROM proyectos WHERE usuario_id = auth.uid()
    )
  );

-- [Similar policies para INSERT, UPDATE, DELETE]
```

**Ejecutar migración:**

```bash
npx supabase db push
```

---

### Tarea 4: Crear Cliente Supabase

**Archivo**: `src/lib/supabase/client.ts` (crear)

```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export const supabase = createClientComponentClient<Database>()

export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
```

**Archivo**: `src/lib/supabase/server.ts` (crear)

```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

export const createServerSupabaseClient = () => {
  return createServerComponentClient<Database>({ cookies })
}
```

---

### Tarea 5: Generar Tipos TypeScript desde Schema

**Comando:**

```bash
npx supabase gen types typescript --project-id "xxx" > src/types/supabase.ts
```

**Archivo**: `src/types/supabase.ts` (generado automáticamente)

Contiene todos los tipos de PostgreSQL mapeados a TypeScript.

---

### Tarea 6: Crear SupabaseAdapter

**Archivo**: `src/lib/sync/adapters/supabase.ts` (crear)

```typescript
import { supabase } from '@/lib/supabase/client'
import { getCurrentTimestamp } from '@/lib/utils'
import type {
  SyncAdapter,
  SyncRequest,
  SyncResponse,
  PullRequest,
  PullResponse,
  SyncEntidad,
} from '../types'

export class SupabaseAdapter implements SyncAdapter {
  async isAvailable(): Promise<boolean> {
    try {
      const { error } = await supabase.from('usuarios').select('id').limit(1)
      return !error
    } catch {
      return false
    }
  }

  async push(request: SyncRequest): Promise<SyncResponse> {
    const { entidad, entidadId, accion, datos } = request

    try {
      const tableName = this.getTableName(entidad)

      if (accion === 'create') {
        const { data, error } = await supabase
          .from(tableName)
          .insert({
            ...datos,
            id: entidadId,
            last_modified: getCurrentTimestamp(),
          })
          .select()
          .single()

        if (error) throw error

        return {
          success: true,
          data,
        }
      }

      if (accion === 'update') {
        const { data, error } = await supabase
          .from(tableName)
          .update({
            ...datos,
            last_modified: getCurrentTimestamp(),
          })
          .eq('id', entidadId)
          .select()
          .single()

        if (error) {
          if (error.code === '23505') {
            const existing = await supabase
              .from(tableName)
              .select()
              .eq('id', entidadId)
              .single()

            return {
              success: false,
              conflict: true,
              serverData: existing.data,
            }
          }
          throw error
        }

        return {
          success: true,
          data,
        }
      }

      if (accion === 'delete') {
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('id', entidadId)

        if (error) throw error

        return {
          success: true,
          data: null,
        }
      }

      throw new Error(`Acción no soportada: ${accion}`)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }
    }
  }

  async pull(request: PullRequest): Promise<PullResponse> {
    const { entidad, since } = request

    try {
      const tableName = this.getTableName(entidad)

      let query = supabase.from(tableName).select('*')

      if (since) {
        query = query.gt('last_modified', since)
      }

      const { data, error } = await query

      if (error) throw error

      return {
        success: true,
        data: data || [],
        lastModified: getCurrentTimestamp(),
      }
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Error desconocido',
      }
    }
  }

  private getTableName(entidad: SyncEntidad): string {
    const mapping: Record<SyncEntidad, string> = {
      proyecto: 'proyectos',
      terreno: 'terrenos',
      zona: 'zonas',
      planta: 'plantas',
      entrada_agua: 'entradas_agua',
      cosecha: 'cosechas',
      alerta: 'alertas',
    }
    return mapping[entidad]
  }
}
```

---

### Tarea 7: Actualizar Hook useSync para usar SupabaseAdapter

**Archivo**: `src/hooks/use-sync.ts` (modificar)

Reemplazar:
```typescript
import { MockAdapter } from '@/lib/sync/adapters/mock'
const adapter = new MockAdapter()
```

Por:
```typescript
import { SupabaseAdapter } from '@/lib/sync/adapters/supabase'
const adapter = new SupabaseAdapter()
```

---

### Tarea 8: Script de Migración de Datos Local → Supabase

**Archivo**: `src/scripts/migrate-to-supabase.ts` (crear)

```typescript
import { db } from '@/lib/db'
import { supabaseAdmin } from '@/lib/supabase/client'

export async function migrateToSupabase(userId: string) {
  console.log('🚀 Iniciando migración a Supabase...')

  try {
    const proyectos = await db.proyectos.where('usuario_id').equals(userId).toArray()

    for (const proyecto of proyectos) {
      console.log(`📦 Migrando proyecto: ${proyecto.nombre}`)

      const { error: proyectoError } = await supabaseAdmin
        .from('proyectos')
        .upsert({
          id: proyecto.id,
          usuario_id: proyecto.usuario_id,
          nombre: proyecto.nombre,
          descripcion: proyecto.descripcion,
          created_at: proyecto.created_at,
          updated_at: proyecto.updated_at,
          last_modified: proyecto.lastModified || proyecto.updated_at,
        })

      if (proyectoError) throw proyectoError

      const terrenos = await db.terrenos.where('proyecto_id').equals(proyecto.id).toArray()

      for (const terreno of terrenos) {
        console.log(`  🌍 Migrando terreno: ${terreno.nombre}`)

        const { error: terrenoError } = await supabaseAdmin
          .from('terrenos')
          .upsert({
            id: terreno.id,
            proyecto_id: terreno.proyecto_id,
            nombre: terreno.nombre,
            ancho: terreno.ancho,
            alto: terreno.alto,
            created_at: terreno.created_at,
            updated_at: terreno.updated_at,
            last_modified: terreno.lastModified || terreno.updated_at,
          })

        if (terrenoError) throw terrenoError

        const zonas = await db.zonas.where('terreno_id').equals(terreno.id).toArray()
        const plantas = await db.plantas.whereAny(zonas.map(z => z.id)).toArray()

        // Migrar zonas y plantas...
      }
    }

    console.log('✅ Migración completada')
  } catch (error) {
    console.error('❌ Error en migración:', error)
    throw error
  }
}
```

---

### Tarea 9: Página de Migración (UI)

**Archivo**: `src/app/migrate/page.tsx` (crear)

```typescript
'use client'

import { useState } from 'react'
import { useAuthContext } from '@/components/providers/AuthProvider'
import { migrateToSupabase } from '@/scripts/migrate-to-supabase'

export default function MigratePage() {
  const { usuario } = useAuthContext()
  const [status, setStatus] = useState<'idle' | 'migrating' | 'success' | 'error'>('idle')

  const handleMigrate = async () => {
    if (!usuario) return

    setStatus('migrating')

    try {
      await migrateToSupabase(usuario.id)
      setStatus('success')
    } catch (error) {
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Migración a Supabase</h1>
        <p className="text-gray-600 mb-6">
          Migra tus datos locales a la nube para habilitar sincronización multi-dispositivo.
        </p>

        {status === 'idle' && (
          <button
            onClick={handleMigrate}
            className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600"
          >
            Iniciar Migración
          </button>
        )}

        {status === 'migrating' && (
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p>Migrando datos...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg">
            ✅ Migración completada exitosamente
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            ❌ Error en la migración. Revisa la consola.
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## Criterios de Aceptación

### Infraestructura
- [ ] Proyecto Supabase creado y configurado
- [ ] Schema PostgreSQL desplegado correctamente
- [ ] RLS configurado para todas las tablas
- [ ] Variables de entorno configuradas

### Código
- [ ] SupabaseAdapter implementado y funcional
- [ ] Cliente Supabase configurado (client y server)
- [ ] Tipos TypeScript generados desde schema
- [ ] useSync actualizado para usar SupabaseAdapter

### Migración
- [ ] Script de migración funciona sin errores
- [ ] Datos locales se replican correctamente en Supabase
- [ ] Página de migración accesible y funcional

### Sync
- [ ] Push de cambios locales → Supabase funciona
- [ ] Pull de cambios remotos → IndexedDB funciona
- [ ] Delta sync (since) reduce tráfico correctamente
- [ ] Conflictos se detectan y manejan

---

## Tests Manuales

1. **Test Push:**
   - Crear proyecto offline
   - Conectar a internet
   - Verificar que aparece en Supabase Dashboard

2. **Test Pull:**
   - Crear proyecto en otro dispositivo
   - Sincronizar en dispositivo original
   - Verificar que aparece en IndexedDB local

3. **Test RLS:**
   - Intentar acceder a datos de otro usuario
   - Verificar que RLS bloquea acceso

4. **Test Migración:**
   - Tener datos locales
   - Ejecutar migración
   - Verificar que todo se replicó correctamente

---

## Siguiente Fase

**FASE_13_AUTH_REAL** - Autenticación real con Supabase Auth
