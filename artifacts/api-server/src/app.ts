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
  // In CJS bundle, __dirname = directory of dist/index.js = dist/
  const publicDir = path.join(__dirname, "public");
  console.log(`[INFO] PORT=${process.env.PORT ?? "3000(default)"} | Static files from: ${publicDir}`);
  app.use(express.static(publicDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
}

export default app;
