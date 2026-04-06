import app from "./app";
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
  // .env not found — use env vars directly
}

const finalPort = Number(process.env["PORT"] ?? "3000") || 3000;

console.log(`[INFO] Starting Divayshakati server on port ${finalPort} (NODE_ENV=${process.env.NODE_ENV})`);

app.listen(finalPort, () => {
  console.log(`[INFO] Server listening on port ${finalPort}`);
}).on("error", (err) => {
  console.error("[ERROR] Failed to start server:", err.message);
  process.exit(1);
});
