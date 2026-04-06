import app from "./app";
import { logger } from "./lib/logger";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Load .env file manually (no external dotenv needed)
try {
  const envPath = resolve(process.cwd(), ".env");
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !(key in process.env)) process.env[key] = val;
  }
} catch {
  // .env not found — that's fine, use env vars directly
}

const rawPort = process.env["PORT"] ?? "3000";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  console.error(`Invalid PORT value: "${rawPort}", defaulting to 3000`);
}

const finalPort = Number.isNaN(port) || port <= 0 ? 3000 : port;

app.listen(finalPort, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port: finalPort }, "Server listening");
});
