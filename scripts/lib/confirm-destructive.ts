/**
 * confirm-destructive.ts — Guard de intención para scripts destructivos.
 *
 * Bloquea la ejecución salvo que la variable de entorno indicada contenga
 * exactamente la frase de confirmación. La frase se elige larga y poco
 * habitual para que no se tipee por accidente ni por copy-paste de un
 * `--force` distraído.
 *
 * Uso:
 *   confirmDestructive({
 *     scriptName: "seed:base",
 *     envVar: "CONFIRM_SEED_BASE",
 *     phrase: "SI-SOBRESCRIBIR-DATOS-GLOBALES",
 *     summary: "Sobrescribe (upsert) filas globales en Supabase. Sin rollback.",
 *     affected: ["tabla_a — descripción", "tabla_b — descripción"],
 *   });
 */

type ConfirmOpts = {
  scriptName: string;
  envVar: string;
  phrase: string;
  summary: string;
  affected: string[];
};

const RED_BANNER = "\x1b[41m\x1b[97m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

export function confirmDestructive(opts: ConfirmOpts): void {
  if (process.env[opts.envVar] === opts.phrase) {
    console.warn(
      `\n${YELLOW}⚠ Confirmación recibida — corriendo ${opts.scriptName}.${RESET}\n`,
    );
    return;
  }

  const padded = (text: string) =>
    `${RED_BANNER}  ${text.padEnd(70)}${RESET}`;

  const tablas = opts.affected.map((line) => `    • ${line}`).join("\n");

  console.error(`
${padded("")}
${padded(`⛔  STOP — ${opts.scriptName.toUpperCase()} ES UNA OPERACIÓN DE INFRAESTRUCTURA`)}
${padded("")}

${RED}  ${opts.summary}${RESET}

  Tablas/recursos afectados:

${tablas}

${YELLOW}  Si entendés el impacto y querés correrlo, declará intención:${RESET}

    ${BOLD}${opts.envVar}=${opts.phrase} pnpm ${opts.scriptName}${RESET}

${DIM}  La frase se diseñó para que no la tipees por accidente.${RESET}
`);
  process.exit(1);
}
