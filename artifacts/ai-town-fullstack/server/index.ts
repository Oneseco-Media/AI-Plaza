import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import pino from "pino";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import aiTownRouter from "./routes/ai-town.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === "production";
const rawPort = process.env.PORT;
if (!rawPort) throw new Error("PORT environment variable is required");
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT: ${rawPort}`);

const basePath = (process.env.BASE_PATH ?? "/ai-town-fullstack/").replace(/\/$/, "");

const logger = pino({ level: "info" });

const app = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) { return { id: req.id, method: req.method, url: req.url?.split("?")[0] }; },
      res(res) { return { statusCode: res.statusCode }; },
    },
  })
);
app.use(cors());
app.use(express.json());

// Mount AI Town API routes at <basePath>/api
app.use(`${basePath}/api`, aiTownRouter);

if (isProduction) {
  // Serve the built Vite frontend statically
  // In prod, __dirname = dist/server/, public is at dist/public/
  const distPath = path.resolve(__dirname, "..", "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(`Build directory not found: ${distPath}. Run "pnpm build" first.`);
  }
  app.use(basePath, express.static(distPath));
  app.use(`${basePath}/*`, (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
  // Also serve at root for convenience
  app.use("/", express.static(distPath));
  app.use("/*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
} else {
  // In development, use Vite dev server as middleware
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    configFile: path.resolve(__dirname, "..", "vite.config.ts"),
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}

app.listen(port, "0.0.0.0", () => {
  logger.info({ port, basePath }, "AI Town Fullstack server running");
});
