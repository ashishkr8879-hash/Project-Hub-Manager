import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

// In production use a simple console-compatible logger to avoid
// pino worker-thread issues on some hosting providers.
const consoleLogger = {
  level: "info",
  info:  (obj: unknown, msg?: string) => console.log("[INFO]",  msg ?? obj, typeof obj === "object" ? JSON.stringify(obj) : ""),
  error: (obj: unknown, msg?: string) => console.error("[ERROR]", msg ?? obj, typeof obj === "object" ? JSON.stringify(obj) : ""),
  warn:  (obj: unknown, msg?: string) => console.warn("[WARN]",  msg ?? obj, typeof obj === "object" ? JSON.stringify(obj) : ""),
  debug: (obj: unknown, msg?: string) => console.debug("[DEBUG]", msg ?? obj),
  fatal: (obj: unknown, msg?: string) => console.error("[FATAL]", msg ?? obj),
  trace: (obj: unknown, msg?: string) => console.debug("[TRACE]", msg ?? obj),
  child: () => consoleLogger,
  silent: () => {},
} as unknown as ReturnType<typeof pino>;

export const logger = isProduction
  ? consoleLogger
  : pino({
      level: process.env.LOG_LEVEL ?? "info",
      redact: [
        "req.headers.authorization",
        "req.headers.cookie",
        "res.headers['set-cookie']",
      ],
      transport: {
        target: "pino-pretty",
        options: { colorize: true },
      },
    });
