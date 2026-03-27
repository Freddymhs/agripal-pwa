/**
 * Tests arquitectónicos: validan que las capas del proyecto respeten sus
 * fronteras. Cualquier violación nueva rompe el build — las violaciones
 * CONOCIDAS se registran en las listas de allowlist con un comentario que
 * explica por qué existen y qué haría falta para eliminarlas.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import path from "path";

const SRC = path.resolve(__dirname, "../../src");

/** Recorre un directorio recursivamente y devuelve todos los archivos. */
function walkDir(dir: string, exts: string[]): string[] {
  const entries = readdirSync(dir);
  const result: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      result.push(...walkDir(full, exts));
    } else if (exts.some((e) => full.endsWith(e))) {
      result.push(full);
    }
  }
  return result;
}

/** Devuelve true si el archivo empieza con "use client" (ignorando comentarios de bloque). */
function isClientComponent(source: string): boolean {
  const firstMeaningfulLine =
    source
      .split("\n")
      .find((l) => l.trim().length > 0 && !l.trim().startsWith("//")) ?? "";
  return /["']use client["']/.test(firstMeaningfulLine);
}

/** Devuelve true si la línea es un import de tipo únicamente (import type ...). */
function hasRuntimeDalImport(source: string): boolean {
  return source
    .split("\n")
    .some(
      (line) =>
        /from\s+["']@\/lib\/dal/.test(line) &&
        !/^\s*import\s+type\s+/.test(line),
    );
}

// ─── 1. CLIENT COMPONENTS NO DEBEN IMPORTAR DAL EN TIEMPO DE EJECUCIÓN ───────

/**
 * Componentes "use client" que actualmente violan la regla.
 * TODO: refactorizar para que usen hooks intermedios en lugar de DAL directo.
 */
/**
 * Componentes "use client" que actualmente llaman DAL directamente.
 * Deberían migrar a hooks intermedios. Registrados para que el test
 * falle si se agrega UNA NUEVA violación, no las ya conocidas.
 */
const KNOWN_CLIENT_DAL_VIOLATIONS = new Set([
  "components/mapa/zona-cultivo-panel.tsx",
  // pages que actúan como client components y llaman DAL sin hook intermedio:
  "app/(app)/agua/configuracion/page.tsx",
  "app/(app)/datos/clima/page.tsx",
  "app/(app)/datos/insumos/page.tsx",
  "app/(app)/terrenos/page.tsx",
]);

describe("Arquitectura — client components no importan DAL runtime", () => {
  const componentFiles = [
    ...walkDir(path.join(SRC, "components"), [".tsx", ".ts"]),
    ...walkDir(path.join(SRC, "app"), [".tsx", ".ts"]),
  ];

  it("solo los archivos en KNOWN_CLIENT_DAL_VIOLATIONS importan DAL desde un client component", () => {
    const violaciones: string[] = [];

    for (const file of componentFiles) {
      const rel = path.relative(SRC, file).replace(/\\/g, "/");
      if (KNOWN_CLIENT_DAL_VIOLATIONS.has(rel)) continue; // ya conocida

      const source = readFileSync(file, "utf-8");
      if (isClientComponent(source) && hasRuntimeDalImport(source)) {
        violaciones.push(rel);
      }
    }

    expect(
      violaciones,
      `Nuevas violaciones encontradas:\n${violaciones.join("\n")}`,
    ).toHaveLength(0);
  });

  it("las violaciones conocidas siguen existiendo (actualizar allowlist si se corrigen)", () => {
    for (const rel of KNOWN_CLIENT_DAL_VIOLATIONS) {
      const file = path.join(SRC, rel);
      const source = readFileSync(file, "utf-8");
      expect(
        isClientComponent(source) && hasRuntimeDalImport(source),
        `${rel} ya no viola la regla — elimínalo de KNOWN_CLIENT_DAL_VIOLATIONS`,
      ).toBe(true);
    }
  });
});

// ─── 2. HOOKS NO IMPORTAN SUPABASE DIRECTAMENTE ───────────────────────────────

/**
 * El único hook autorizado a importar Supabase directamente es el de auth,
 * que gestiona la sesión de usuario y no puede abstraerse fácilmente.
 */
const KNOWN_HOOK_SUPABASE_IMPORTS = new Set(["hooks/use-supabase-auth.ts"]);

describe("Arquitectura — hooks no importan Supabase directamente", () => {
  const hookFiles = walkDir(path.join(SRC, "hooks"), [".ts", ".tsx"]);

  it("solo los hooks en KNOWN_HOOK_SUPABASE_IMPORTS usan createClient/supabase-js", () => {
    const violaciones: string[] = [];

    for (const file of hookFiles) {
      const rel = path.relative(SRC, file).replace(/\\/g, "/");
      if (KNOWN_HOOK_SUPABASE_IMPORTS.has(rel)) continue;

      const source = readFileSync(file, "utf-8");
      const importaSupabase =
        /from\s+["']@supabase\/supabase-js["']/.test(source) ||
        /createClient\s*\(/.test(source);

      if (importaSupabase) violaciones.push(rel);
    }

    expect(
      violaciones,
      `Hooks que importan Supabase directamente:\n${violaciones.join("\n")}`,
    ).toHaveLength(0);
  });
});

// ─── 3. DAL NO IMPORTA HOOKS ─────────────────────────────────────────────────

describe("Arquitectura — DAL no importa hooks", () => {
  const dalFiles = walkDir(path.join(SRC, "lib", "dal"), [".ts", ".tsx"]);

  it("ningún archivo DAL importa desde src/hooks", () => {
    const violaciones: string[] = [];

    for (const file of dalFiles) {
      const source = readFileSync(file, "utf-8");
      if (
        /from\s+["']@\/hooks\//.test(source) ||
        /from\s+["']\.\.\/hooks\//.test(source)
      ) {
        violaciones.push(path.relative(SRC, file));
      }
    }

    expect(
      violaciones,
      `DAL que importa hooks:\n${violaciones.join("\n")}`,
    ).toHaveLength(0);
  });
});

// ─── 4. PROHIBICIÓN DE new Date().toISOString() INLINE ───────────────────────

/**
 * Archivos autorizados a usar new Date().toISOString():
 * - utils/index.ts: es la implementación de getCurrentTimestamp()
 * - archivos de test: los fixtures de test usan fechas literales sin problema
 */
describe("Arquitectura — prohibición de new Date().toISOString() inline", () => {
  const allSrcFiles = walkDir(SRC, [".ts", ".tsx"]).filter(
    (f) => !f.includes("__tests__") && !f.includes(".test."),
  );

  it("no hay llamadas a new Date().toISOString() fuera de utils/index.ts", () => {
    const violaciones: string[] = [];

    for (const file of allSrcFiles) {
      const rel = path.relative(SRC, file).replace(/\\/g, "/");
      if (rel === "lib/utils/index.ts") continue; // implementación autorizada

      const source = readFileSync(file, "utf-8");
      if (/new Date\(\)\.toISOString\(\)/.test(source)) {
        violaciones.push(rel);
      }
    }

    expect(
      violaciones,
      `Usa getCurrentTimestamp() en lugar de new Date().toISOString():\n${violaciones.join("\n")}`,
    ).toHaveLength(0);
  });
});

// ─── 5. COMPONENTES NO USAN console.log/warn/error EN PRODUCCIÓN ─────────────

/**
 * Archivos autorizados: scripts de seed/migración y configuración.
 * Los tests están excluidos arriba con el filtro.
 */
const CONSOLE_ALLOWLIST_PATTERNS = [
  "scripts/",
  "supabase/",
  "next.config",
  "vitest.config",
  "postcss.config",
  "tailwind.config",
];

describe("Arquitectura — prohibición de console.log/warn/error en producción", () => {
  const appFiles = walkDir(SRC, [".ts", ".tsx"]).filter(
    (f) =>
      !f.includes("__tests__") &&
      !f.includes(".test.") &&
      !f.includes(".spec."),
  );

  it("no hay console.log/warn/error en src/ fuera de archivos de setup", () => {
    const violaciones: string[] = [];

    for (const file of appFiles) {
      const rel = path
        .relative(path.resolve(__dirname, "../../"), file)
        .replace(/\\/g, "/");

      if (CONSOLE_ALLOWLIST_PATTERNS.some((p) => rel.includes(p))) continue;

      const source = readFileSync(file, "utf-8");
      const lines = source.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Ignorar líneas comentadas
        if (/^\s*\/\//.test(line)) continue;
        if (/console\.(log|warn|error)\s*\(/.test(line)) {
          violaciones.push(`${rel}:${i + 1}`);
        }
      }
    }

    expect(
      violaciones,
      `Usa el logger centralizado del proyecto:\n${violaciones.join("\n")}`,
    ).toHaveLength(0);
  });
});
