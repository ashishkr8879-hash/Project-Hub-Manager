// Simple console-based logger — no pino, no worker threads
const level = process.env.LOG_LEVEL ?? "info";

function fmt(obj: unknown, msg?: string): string {
  if (msg) return `${msg} ${typeof obj === "object" ? JSON.stringify(obj) : obj}`;
  return typeof obj === "string" ? obj : JSON.stringify(obj);
}

export const logger = {
  level,
  info:  (obj: unknown, msg?: string) => console.log ("[INFO] ", fmt(obj, msg)),
  error: (obj: unknown, msg?: string) => console.error("[ERROR]", fmt(obj, msg)),
  warn:  (obj: unknown, msg?: string) => console.warn ("[WARN] ", fmt(obj, msg)),
  debug: (obj: unknown, msg?: string) => console.debug("[DEBUG]", fmt(obj, msg)),
  fatal: (obj: unknown, msg?: string) => console.error("[FATAL]", fmt(obj, msg)),
  trace: (obj: unknown, msg?: string) => {},
  child: (_bindings: unknown) => logger,
  silent: () => {},
};

export type Logger = typeof logger;
