/**
 * seed.ts — Restaura datos piloto de AgriPlan en una BD vacía.
 *
 * Idempotente: borra y recrea el proyecto seed por cada usuario.
 * Otros usuarios en la BD no son tocados.
 *
 * Requiere en .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SEED_USER_EMAIL
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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

// ─── Constantes ───────────────────────────────────────────────────────────────

const NOMBRE_PROYECTO_SEED = "Proyecto Regional";
const NOMBRE_TERRENO_SEED = "Terreno Ejemplo";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function resolveUserId(
  sb: SupabaseClient,
  email?: string,
): Promise<string> {
  const target = email ?? process.env.SEED_USER_EMAIL;
  if (!target) throw new Error("Falta SEED_USER_EMAIL en .env.local");

  const { data, error } = await sb.auth.admin.listUsers();
  if (error) throw new Error(`No se pudo listar usuarios: ${error.message}`);
  const user = data.users.find((u) => u.email === target);
  if (!user) throw new Error(`No existe usuario con email "${target}"`);
  return user.id;
}

async function deleteProyectoSeed(
  sb: SupabaseClient,
  usuarioId: string,
  nombreProyecto: string,
): Promise<void> {
  const { data: proyectos, error: fetchError } = await sb
    .from("proyectos")
    .select("id")
    .eq("usuario_id", usuarioId)
    .eq("nombre", nombreProyecto);

  if (fetchError) throw new Error(`proyectos fetch: ${fetchError.message}`);
  if (!proyectos || proyectos.length === 0) return;

  for (const proyecto of proyectos) {
    const { data: terrenos, error: terrenosError } = await sb
      .from("terrenos")
      .select("id")
      .eq("proyecto_id", proyecto.id);

    if (terrenosError) throw new Error(`terrenos fetch: ${terrenosError.message}`);

    if (terrenos && terrenos.length > 0) {
      const terrenoIds = terrenos.map((t) => t.id);

      const { error: zonasError } = await sb
        .from("zonas")
        .delete()
        .in("terreno_id", terrenoIds);
      if (zonasError) throw new Error(`zonas delete: ${zonasError.message}`);

      const { error: terrenosDelError } = await sb
        .from("terrenos")
        .delete()
        .in("id", terrenoIds);
      if (terrenosDelError) throw new Error(`terrenos delete: ${terrenosDelError.message}`);
    }

    const { error: proyectoDelError } = await sb
      .from("proyectos")
      .delete()
      .eq("id", proyecto.id);
    if (proyectoDelError) throw new Error(`proyectos delete: ${proyectoDelError.message}`);
  }

  console.log(`  · Proyecto "${nombreProyecto}" previo eliminado`);
}

// ─── Zonas por usuario ────────────────────────────────────────────────────────

type ZonaDato = Record<string, unknown>;
type ZonaDef = { nombre: string; tipo: string; datos: ZonaDato };

const ZONAS_FREDDY: ZonaDef[] = [
  {
    nombre: "C5",
    tipo: "cultivo",
    datos: {
      x: 5, y: 5, ancho: 64, alto: 22, area_m2: 1408,
      color: "#16a34a", estado: "activa",
      notas: "Franja norte completa. Choclo año 1 (tolera boro/sal, limpia suelo, ingresos mes 4). Luego rotar a Maracuya espaldera N-S.",
    },
  },
  {
    nombre: "C4",
    tipo: "cultivo",
    datos: {
      x: 5, y: 32, ancho: 17, alto: 78, area_m2: 1326,
      color: "#16a34a", estado: "activa",
      notas: "Columna oeste. Tuna: costo casi cero, poca agua, produccion constante año 3+. Sol de tarde suficiente.",
    },
  },
  {
    nombre: "C3a",
    tipo: "cultivo",
    datos: {
      x: 30, y: 32, ancho: 39, alto: 35, area_m2: 1365,
      color: "#16a34a", estado: "activa",
      notas: "Mejor zona: punto mas alto + primer sol de mañana + mas cerca del estanque. Granada año 2-4.",
    },
  },
  {
    nombre: "C3b",
    tipo: "cultivo",
    datos: {
      x: 30, y: 67, ancho: 24, alto: 15, area_m2: 360,
      color: "#16a34a", estado: "activa",
      notas: "Maracuya espaldera. Postes direccion E-O, 24m de largo. Retorno rapido 8-10 meses.",
    },
  },
  {
    nombre: "Estanques",
    tipo: "estanque",
    datos: {
      x: 54, y: 67, ancho: 15, alto: 15, area_m2: 225,
      color: "#0ea5e9", estado: "activa",
      notas: "4 slots 3x3m en grilla 2x2. Empieza 1x20000L, expande hasta 80000L total. Torre 6-8m.",
      estanque_config: {
        capacidad_m3: 20, nivel_actual_m3: 20,
        material: "plastico", altura_torre_m: 7,
      },
    },
  },
  {
    nombre: "C2",
    tipo: "cultivo",
    datos: {
      x: 30, y: 87, ancho: 39, alto: 40, area_m2: 1560,
      color: "#16a34a", estado: "activa",
      notas: "Granada permanente año 2+. Bloque central derecho. Primer sol de mañana.",
    },
  },
  {
    nombre: "Compostera",
    tipo: "compostera",
    datos: {
      x: 5, y: 111, ancho: 8, alto: 4, area_m2: 32,
      color: "#78350f", estado: "activa",
      notas: "Mezcla estiercol comprado + restos de poda. Insumo base para materia organica en suelo desertico.",
    },
  },
  {
    nombre: "Bodega Cosecha",
    tipo: "bodega",
    datos: {
      x: 5, y: 116, ancho: 10, alto: 15, area_m2: 150,
      color: "#92400e", estado: "activa",
      notas: "Palas, azadas, podadoras, tijeras, escaleras, EPP, motobomba, repuestos riego, mangueras.",
    },
  },
  {
    nombre: "Bodega Insumos y Herramienta",
    tipo: "bodega",
    datos: {
      x: 5, y: 131, ancho: 10, alto: 12, area_m2: 120,
      color: "#92400e", estado: "activa",
      notas: "Fertilizantes/guano (pallets), gabinete quimico con llave, 200-300 cajas cosecha. Futura camara fria.",
    },
  },
  {
    nombre: "C1",
    tipo: "cultivo",
    datos: {
      x: 30, y: 132, ancho: 39, alto: 35, area_m2: 1365,
      color: "#16a34a", estado: "activa",
      notas: "Mas cercano al apron de carga. Choclo año 1-2 (ingresos rapidos), luego Maracuya. <30m al apron.",
    },
  },
  {
    nombre: "Garage",
    tipo: "garage",
    datos: {
      x: 5, y: 146, ancho: 10, alto: 6, area_m2: 60,
      color: "#1d4ed8", estado: "activa",
      notas: "Porter K2500 + auto + moto con carretilla lado a lado. Puerta hacia corredor interior.",
    },
  },
  {
    nombre: "Casa",
    tipo: "casa",
    datos: {
      x: 5, y: 152, ancho: 10, alto: 10, area_m2: 100,
      color: "#f97316", estado: "activa",
      notas: "Casa de campo 14x10m. Dormitorio litera (2 personas), living/cocina basica, bano.",
    },
  },
  {
    nombre: "Bano",
    tipo: "sanitario",
    datos: {
      x: 5, y: 162, ancho: 5, alto: 5, area_m2: 25,
      color: "#475569", estado: "activa",
      notas: "",
    },
  },
  {
    nombre: "Empaque",
    tipo: "empaque",
    datos: {
      x: 30, y: 167, ancho: 39, alto: 4, area_m2: 156,
      color: "#f59e0b", estado: "activa",
      notas: "Area techada (sombra) para pesar, revisar calidad y armar cajas antes de cargar el Porter.",
    },
  },
  {
    nombre: "Fosa Septica",
    tipo: "sanitario",
    datos: {
      x: 5, y: 172, ancho: 5, alto: 5, area_m2: 25,
      color: "#475569", estado: "activa",
      notas: "Tanque subterraneo. Superficie reservada para acceso del camion limpiafosa. Conectada al bano.",
    },
  },
  {
    nombre: "Apron Carga",
    tipo: "apron",
    datos: {
      x: 10, y: 171, ancho: 59, alto: 6, area_m2: 354,
      color: "#d97706", estado: "activa",
      notas: "Porter K2500 + zona carga lateral + persona con carretilla = 4.7m minimo. 5m corredor OK. Ripio compactado.",
    },
  },
];

const ZONAS_PRUEBA: ZonaDef[] = [
  {
    nombre: "Zona Cultivo A",
    tipo: "cultivo",
    datos: {
      x: 5, y: 5, ancho: 40, alto: 30, area_m2: 1200,
      color: "#16a34a", estado: "activa",
      notas: "Zona de cultivo de ejemplo.",
    },
  },
  {
    nombre: "Zona Cultivo B",
    tipo: "cultivo",
    datos: {
      x: 5, y: 40, ancho: 40, alto: 30, area_m2: 1200,
      color: "#16a34a", estado: "activa",
      notas: "Segunda zona de cultivo de ejemplo.",
    },
  },
  {
    nombre: "Estanque Ejemplo",
    tipo: "estanque",
    datos: {
      x: 5, y: 75, ancho: 10, alto: 10, area_m2: 100,
      color: "#0ea5e9", estado: "activa",
      notas: "Estanque de agua de ejemplo.",
      estanque_config: {
        capacidad_m3: 15, nivel_actual_m3: 15,
        material: "plastico", altura_torre_m: 5,
      },
    },
  },
  {
    nombre: "Bodega Ejemplo",
    tipo: "bodega",
    datos: {
      x: 35, y: 75, ancho: 10, alto: 10, area_m2: 100,
      color: "#92400e", estado: "activa",
      notas: "Bodega de herramientas e insumos de ejemplo.",
    },
  },
];

// ─── Seed completo por usuario ────────────────────────────────────────────────

type TerrenoConfig = {
  ancho_m: number;
  alto_m: number;
  area_m2: number;
  agua_disponible_m3: number;
  agua_actual_m3: number;
};

const TERRENO_FREDDY: TerrenoConfig = {
  ancho_m: 74, alto_m: 181, area_m2: 13394,
  agua_disponible_m3: 20, agua_actual_m3: 20,
};

const TERRENO_PRUEBA: TerrenoConfig = {
  ancho_m: 50, alto_m: 100, area_m2: 5000,
  agua_disponible_m3: 15, agua_actual_m3: 15,
};

async function seedProyectoCompleto(
  sb: SupabaseClient,
  usuarioId: string,
  terrenoConfig: TerrenoConfig,
  zonas: ZonaDef[],
): Promise<void> {
  await deleteProyectoSeed(sb, usuarioId, NOMBRE_PROYECTO_SEED);

  const { data: proyecto, error: proyectoError } = await sb
    .from("proyectos")
    .insert({ usuario_id: usuarioId, nombre: NOMBRE_PROYECTO_SEED, datos: {} })
    .select("id")
    .single();
  if (proyectoError) throw new Error(`proyectos: ${proyectoError.message}`);
  console.log(`  ✓ Proyecto "${NOMBRE_PROYECTO_SEED}" (id: ${proyecto.id})`);

  const { data: terreno, error: terrenoError } = await sb
    .from("terrenos")
    .insert({
      proyecto_id: proyecto.id,
      nombre: NOMBRE_TERRENO_SEED,
      datos: {
        ancho_m: terrenoConfig.ancho_m,
        alto_m: terrenoConfig.alto_m,
        area_m2: terrenoConfig.area_m2,
        agua_disponible_m3: terrenoConfig.agua_disponible_m3,
        agua_actual_m3: terrenoConfig.agua_actual_m3,
        suelo: null,
        sistema_riego: null,
      },
    })
    .select("id")
    .single();
  if (terrenoError) throw new Error(`terrenos: ${terrenoError.message}`);
  console.log(`  ✓ Terreno "${NOMBRE_TERRENO_SEED}" (id: ${terreno.id})`);

  const payload = zonas.map((z) => ({
    terreno_id: terreno.id,
    nombre: z.nombre,
    tipo: z.tipo,
    datos: z.datos,
  }));

  const { data: zonasData, error: zonasError } = await sb
    .from("zonas")
    .insert(payload)
    .select("nombre");
  if (zonasError) throw new Error(`zonas: ${zonasError.message}`);
  console.log(`  ✓ ${zonasData.length} zonas creadas:`);
  zonasData.forEach((z) => console.log(`      · ${z.nombre}`));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

(async () => {
  try {
    console.log("\n[0] Inicio del Seed\n");

    console.log("[1] Freddy (usuario principal)");
    const freddyId = await resolveUserId(supabase);
    console.log(`    Usuario: ${freddyId}`);
    await seedProyectoCompleto(supabase, freddyId, TERRENO_FREDDY, ZONAS_FREDDY);

    console.log("\n[2] prueba@agriplan.cl");
    const pruebaId = await resolveUserId(supabase, "prueba@agriplan.cl");
    console.log(`    Usuario: ${pruebaId}`);
    await seedProyectoCompleto(supabase, pruebaId, TERRENO_PRUEBA, ZONAS_PRUEBA);

    console.log("\n✅ Seed completado exitosamente.\n");
  } catch (error) {
    console.error("\n❌ Seed fallido:", (error as Error).message);
    process.exit(1);
  }
})();
