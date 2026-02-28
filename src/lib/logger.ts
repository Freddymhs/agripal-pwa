type LogLevel = "debug" | "info" | "warn" | "error";

const isDev = process.env.NODE_ENV === "development";

function log(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
) {
  if (level === "debug" && !isDev) return;

  const method = level === "debug" ? "log" : level;
  console[method](`[${level.toUpperCase()}] ${message}`, context ?? "");
}

export const logger = {
  debug: (msg: string, ctx?: Record<string, unknown>) => log("debug", msg, ctx),
  info: (msg: string, ctx?: Record<string, unknown>) => log("info", msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => log("warn", msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => log("error", msg, ctx),
};
