/**
 * seed-base.ts — Puebla todas las tablas base globales de AgriPlan.
 *
 * Correr UNA VEZ al hacer setup de una BD nueva.
 * Cada usuario que cree un proyecto recibira estos datos
 * automaticamente en su copia personal (via trigger).
 *
 * Uso:
 *   pnpm seed:base
 *
 * Requiere en .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// ─── Cliente ─────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Faltan variables: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Helper ───────────────────────────────────────────────────────────────────

function readJson<T>(filePath: string): T {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), filePath), "utf-8"),
  ) as T;
}

type RawRecord = Record<string, unknown>;

// ─── Funciones por tabla ──────────────────────────────────────────────────────

async function seedCatalogoBase(sb: SupabaseClient): Promise<void> {
  const frutas = readJson<RawRecord[]>("data/seed/cultivos-frutas.json");
  const extras = readJson<RawRecord[]>("data/seed/cultivos-extras.json");

  const payload = [...frutas, ...extras].map((c) => {
    const {
      id,
      nombre,
      tier,
      tipo,
      origen,
      kc_plantula,
      kc_joven,
      kc_adulta,
      kc_madura,
      proyecto_id: _p,
      created_at: _ca,
      updated_at: _ua,
      ...datos
    } = c;
    return {
      id: id as string,
      nombre: nombre as string,
      tier: (tier as string) ?? "base",
      tipo: (tipo as string) ?? "fruta",
      origen: (origen as string) ?? "seed",
      kc_plantula: (kc_plantula as number) ?? null,
      kc_joven: (kc_joven as number) ?? null,
      kc_adulta: (kc_adulta as number) ?? null,
      kc_madura: (kc_madura as number) ?? null,
      datos,
    };
  });

  const { error } = await sb
    .from("catalogo_base")
    .upsert(payload, { onConflict: "id" });
  if (error) throw new Error(`catalogo_base: ${error.message}`);
  console.log(`  ✓ ${payload.length} cultivos (frutas.json + extras.json)`);
}

async function seedVariedades(sb: SupabaseClient): Promise<void> {
  const raw = readJson<RawRecord[]>("data/seed/variedades.json");

  const payload = raw.map((v) => {
    const { id, cultivo_id, nombre, ...datos } = v;
    return {
      id: id as string,
      cultivo_id: cultivo_id as string,
      nombre: nombre as string,
      datos,
    };
  });

  const { error } = await sb
    .from("variedades_base")
    .upsert(payload, { onConflict: "id" });
  if (error) throw new Error(`variedades_base: ${error.message}`);
  console.log(`  ✓ ${payload.length} variedades`);
}

async function seedInsumos(sb: SupabaseClient): Promise<void> {
  const raw = readJson<{ insumos: RawRecord[] }>("data/seed/insumos.json");

  const payload = raw.insumos.map((i) => {
    const { id, nombre, tipo, ...datos } = i;
    return {
      id: id as string,
      nombre: nombre as string,
      tipo: tipo as string,
      datos,
    };
  });

  const { error } = await sb
    .from("insumos_base")
    .upsert(payload, { onConflict: "id" });
  if (error) throw new Error(`insumos_base: ${error.message}`);
  console.log(`  ✓ ${payload.length} insumos`);
}

async function seedEnmiendas(sb: SupabaseClient): Promise<void> {
  const raw = readJson<RawRecord[]>("data/seed/enmiendas-suelo.json");

  const payload = raw.map((e) => {
    const { id, nombre, tipo, ...datos } = e;
    return {
      id: id as string,
      nombre: nombre as string,
      tipo: tipo as string,
      datos,
    };
  });

  const { error } = await sb
    .from("enmiendas_base")
    .upsert(payload, { onConflict: "id" });
  if (error) throw new Error(`enmiendas_base: ${error.message}`);
  console.log(`  ✓ ${payload.length} enmiendas de suelo`);
}

async function seedTecnicas(sb: SupabaseClient): Promise<void> {
  const raw = readJson<RawRecord[]>("data/seed/tecnicas.json");

  const payload = raw.map((t) => {
    const { id, nombre, categoria, ...datos } = t;
    return {
      id: id as string,
      nombre: nombre as string,
      categoria: categoria as string,
      datos,
    };
  });

  const { error } = await sb
    .from("tecnicas_base")
    .upsert(payload, { onConflict: "id" });
  if (error) throw new Error(`tecnicas_base: ${error.message}`);
  console.log(`  ✓ ${payload.length} tecnicas de mejora`);
}

async function seedClima(sb: SupabaseClient): Promise<void> {
  const regiones: {
    id: string;
    climaFile: string;
    etoFile: string;
    label: string;
  }[] = [
    {
      id: "arica-pampa-interior",
      climaFile: "data/seed/clima.json",
      etoFile: "data/seed/evapotranspiracion.json",
      label: "Arica pampa interior",
    },
    {
      id: "iquique-costa",
      climaFile: "data/seed/clima-iquique.json",
      etoFile: "data/seed/evapotranspiracion-iquique.json",
      label: "Iquique costa",
    },
    {
      id: "antofagasta-litoral",
      climaFile: "data/seed/clima-antofagasta.json",
      etoFile: "data/seed/evapotranspiracion-antofagasta.json",
      label: "Antofagasta litoral",
    },
    {
      id: "arica-valle-azapa",
      climaFile: "data/seed/clima-azapa.json",
      etoFile: "data/seed/evapotranspiracion-azapa.json",
      label: "Arica Valle Azapa",
    },
    {
      id: "arica-valle-lluta",
      climaFile: "data/seed/clima-lluta.json",
      etoFile: "data/seed/evapotranspiracion-lluta.json",
      label: "Arica Valle Lluta",
    },
    {
      id: "arica-ciudad",
      climaFile: "data/seed/clima-arica-ciudad.json",
      etoFile: "data/seed/evapotranspiracion-arica-ciudad.json",
      label: "Arica ciudad costera",
    },
    {
      id: "tacna-ciudad",
      climaFile: "data/seed/clima-tacna.json",
      etoFile: "data/seed/evapotranspiracion-tacna.json",
      label: "Tacna ciudad (Perú)",
    },
  ];

  const payload = regiones.map(({ id, climaFile, etoFile }) => {
    const clima = readJson<RawRecord>(climaFile);
    const eto = readJson<RawRecord>(etoFile);
    const region = `${clima.region as string} - ${clima.zona as string}`;
    return { id, region, datos: { ...clima, evapotranspiracion_detalle: eto } };
  });

  const { error } = await sb
    .from("clima_base")
    .upsert(payload, { onConflict: "id" });
  if (error) throw new Error(`clima_base: ${error.message}`);
  console.log(
    `  ✓ ${payload.length} registros de clima (${regiones.map((r) => r.label).join(", ")})`,
  );
}

async function seedFuentesAgua(sb: SupabaseClient): Promise<void> {
  const raw = readJson<RawRecord[]>("data/seed/fuentes-agua.json");

  const payload = raw.map((f) => {
    const { id, nombre, tipo, ...datos } = f;
    return {
      id: id as string,
      nombre: nombre as string,
      tipo: tipo as string,
      datos,
    };
  });

  const { error } = await sb
    .from("fuentes_agua_base")
    .upsert(payload, { onConflict: "id" });
  if (error) throw new Error(`fuentes_agua_base: ${error.message}`);
  console.log(`  ✓ ${payload.length} fuentes de agua`);
}

async function seedPrecios(sb: SupabaseClient): Promise<void> {
  const raw = readJson<RawRecord[]>("data/seed/precios.json");

  const payload = raw.map((p) => {
    const {
      id,
      cultivo_id,
      nombre,
      region,
      nombre_odepa,
      precio_actual_clp,
      precio_min_clp,
      precio_max_clp,
      tendencia,
      fuente,
      ...datos
    } = p;
    return {
      id: id as string,
      cultivo_id: cultivo_id as string,
      nombre: nombre as string,
      region: region as string,
      nombre_odepa: (nombre_odepa as string) ?? null,
      precio_actual_clp: (precio_actual_clp as number) ?? null,
      precio_min_clp: (precio_min_clp as number) ?? null,
      precio_max_clp: (precio_max_clp as number) ?? null,
      tendencia: (tendencia as string) ?? null,
      fuente: (fuente as string) ?? null,
      datos,
    };
  });

  const { error } = await sb
    .from("precios_mayoristas")
    .upsert(payload, { onConflict: "id" });
  if (error) throw new Error(`precios_mayoristas: ${error.message}`);
  console.log(`  ✓ ${payload.length} precios mayoristas`);

  // Config: trazabilidad de quién estableció cada precio
  const FUENTE_TO_UPDATED_BY: Record<string, string> = {
    odepa: "api",
    estimado: "skill",
    investigacion: "admin",
  };

  const configPayload = raw.map((p) => ({
    precio_id: p.id as string,
    updated_by: FUENTE_TO_UPDATED_BY[(p.fuente as string) ?? ""] ?? "seed",
    origen: "seed" as const,
  }));

  const { error: configError } = await sb
    .from("precios_mayoristas_config")
    .upsert(configPayload, { onConflict: "precio_id" });
  if (configError)
    throw new Error(`precios_mayoristas_config: ${configError.message}`);
  console.log(`  ✓ ${configPayload.length} precios config (trazabilidad)`);
}

async function seedMercadoDetalle(sb: SupabaseClient): Promise<void> {
  const raw = readJson<RawRecord[]>("data/seed/mercado-detalle.json");

  const payload = raw.map((p) => ({
    precio_mayorista_id: p.precio_mayorista_id as string,
    demanda_local: (p.demanda_local as string) ?? null,
    competencia_local: (p.competencia_local as string) ?? null,
    mercado_exportacion: (p.mercado_exportacion as boolean) ?? false,
    notas: (p.notas as string) ?? null,
  }));

  const { error } = await sb
    .from("mercado_detalle")
    .upsert(payload, { onConflict: "precio_mayorista_id" });
  if (error) throw new Error(`mercado_detalle: ${error.message}`);
  console.log(`  ✓ ${payload.length} contextos de mercado`);
}

async function seedPlanes(sb: SupabaseClient): Promise<void> {
  // Verificar si ya existe
  const { data: existente } = await sb
    .from("planes")
    .select("id")
    .eq("nombre", "Plan Mensual")
    .maybeSingle();

  if (existente) {
    console.log(`  ✓ Plan Mensual ya existe (skip)`);
    return;
  }

  const { error } = await sb.from("planes").insert({
    nombre: "Plan Mensual",
    precio: 9990,
    moneda: "CLP",
    intervalo: "monthly",
    descripcion: "Acceso completo a AgriPlan",
    activo: true,
  });
  if (error) throw new Error(`planes: ${error.message}`);
  console.log(`  ✓ Plan Mensual ($9.990 CLP)`);
}

// ─── Usuarios de prueba ───────────────────────────────────────────────────────

/**
 * Freddy Huaylla — usuario propietario con suscripción pagada activa.
 * El trigger `on_auth_user_created` crea automáticamente una suscripción
 * en estado 'trialing'. Esta función la eleva a 'active'.
 */
async function addFreddyWithSubscription(sb: SupabaseClient): Promise<void> {
  const email = "fmarcosdev@gmail.com";

  const { data: usersData } = await sb.auth.admin.listUsers();
  const existing = usersData?.users.some((u) => u.email === email);

  if (existing) {
    console.log(`  ✓ Freddy ya existe (skip)`);
    return;
  }

  const { data: created, error: createError } = await sb.auth.admin.createUser({
    email,
    password: "freddy1992",
    email_confirm: true,
    user_metadata: { full_name: "Freddy Huaylla" },
  });
  if (createError)
    throw new Error(`addFreddyWithSubscription: ${createError.message}`);

  const userId = created.user.id;
  const now = new Date();
  const in1Year = new Date(now);
  in1Year.setFullYear(in1Year.getFullYear() + 1);

  const { error: subError } = await sb
    .from("suscripciones")
    .update({
      estado: "active",
      current_period_start: now.toISOString(),
      current_period_end: in1Year.toISOString(),
    })
    .eq("usuario_id", userId);
  if (subError)
    throw new Error(`addFreddyWithSubscription (sub): ${subError.message}`);

  console.log(
    `  ✓ Freddy Huaylla creado con suscripcion activa hasta ${in1Year.toISOString().slice(0, 10)}`,
  );
}

/**
 * Usuario de prueba — trial de 6 meses activo, sin suscripción pagada.
 * El trigger ya crea el estado 'trialing' con 180 días. No se modifica.
 * Se crea un proyecto de ejemplo con terreno y zonas genéricas.
 */
async function addUsuarioPrueba(sb: SupabaseClient): Promise<void> {
  const email = "prueba@agriplan.cl";

  const { data: usersData } = await sb.auth.admin.listUsers();
  const existing = usersData?.users.some((u) => u.email === email);

  if (existing) {
    console.log(`  ✓ Usuario prueba ya existe (skip)`);
    return;
  }

  const { error } = await sb.auth.admin.createUser({
    email,
    password: "agriplan",
    email_confirm: true,
    user_metadata: { full_name: "Usuario Prueba" },
  });
  if (error) throw new Error(`addUsuarioPrueba: ${error.message}`);

  console.log(`  ✓ Usuario prueba creado (trial 6 meses activo por trigger)`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

(async () => {
  try {
    console.log("\n[0] Verificando estado de la BD...");
    const { data: usersData, error: checkError } = await supabase.auth.admin.listUsers();

    if (checkError) {
      console.error(
        "\n⛔ Seed bloqueado: no se pudo verificar el estado de la BD.\n  ",
        checkError.message,
        "\n   Revisa la conexión y las variables de entorno antes de continuar.\n",
      );
      process.exit(1);
    }

    const freddyExists = usersData.users.some(
      (u) => u.email === "fmarcosdev@gmail.com",
    );

    if (freddyExists) {
      console.log(
        "\n⛔ Seed bloqueado: la BD ya fue inicializada (usuario fmarcosdev@gmail.com existe).\n   Ejecuta el seed solo en una BD nueva.\n",
      );
      process.exit(0);
    }

    console.log("\n[1] BD nueva detectada. Iniciando Seed Base\n");

    console.log("[2] Catalogo de cultivos");
    await seedCatalogoBase(supabase);

    console.log("\n[3] Variedades");
    await seedVariedades(supabase);

    console.log("\n[4] Insumos");
    await seedInsumos(supabase);

    console.log("\n[5] Enmiendas de suelo");
    await seedEnmiendas(supabase);

    console.log("\n[6] Tecnicas de mejora");
    await seedTecnicas(supabase);

    console.log("\n[7] Clima");
    await seedClima(supabase);

    console.log("\n[8] Fuentes de agua");
    await seedFuentesAgua(supabase);

    console.log("\n[9] Precios mayoristas");
    await seedPrecios(supabase);

    console.log("\n[10] Precios contexto (inteligencia de mercado)");
    await seedMercadoDetalle(supabase);

    console.log("\n[11] Plan de suscripcion");
    await seedPlanes(supabase);

    console.log("\n[12] Usuario Freddy Huaylla (suscripcion activa)");
    await addFreddyWithSubscription(supabase);

    console.log("\n[13] Usuario de prueba (trial 6 meses)");
    await addUsuarioPrueba(supabase);

    console.log(
      "\n✅ Seed base completado. Nuevos usuarios recibiran estos datos al crear su primer proyecto.\n",
    );
  } catch (error) {
    console.error("\n❌ Seed base fallido:", (error as Error).message);
    process.exit(1);
  }
})();
