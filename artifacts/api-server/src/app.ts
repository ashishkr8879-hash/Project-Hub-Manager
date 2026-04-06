import express, { type Express } from "express";
import cors from "cors";
import path from "node:path";
import router from "./routes";

const app: Express = express();

// Simple request logger — no pino-http in production
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url?.split("?")[0]}`);
  next();
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Production: serve the built React frontend
if (process.env.NODE_ENV === "production") {
  // __dirname is set by esbuild banner = directory of dist/index.mjs = dist/
  const distDir = typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(new URL(import.meta.url).pathname);
  const publicDir = path.join(distDir, "public");
  console.log(`[INFO] PORT=${process.env.PORT ?? "3000(default)"} | Static files from: ${publicDir}`);
  app.use(express.static(publicDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
}

export default app;
