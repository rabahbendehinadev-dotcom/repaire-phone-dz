import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// ── Production: serve the pre-built frontend SPA ────────────────────────────
// In Docker the layout is:
//   /app/artifacts/api-server/dist/index.mjs  ← __dirname here
//   /app/public/index.html                     ← frontend build
// Override with FRONTEND_DIST env var if needed.
if (process.env.NODE_ENV === "production") {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const publicDir =
    process.env.FRONTEND_DIST ||
    path.resolve(__dirname, "../../../public");

  if (existsSync(publicDir)) {
    app.use(express.static(publicDir, { maxAge: "1y", immutable: true }));
    // SPA fallback — all non-/api routes return index.html
    app.get("*", (_req, res) => {
      res.sendFile(path.join(publicDir, "index.html"));
    });
    logger.info({ publicDir }, "Serving frontend static files");
  } else {
    logger.warn({ publicDir }, "Frontend build not found — static serving disabled");
  }
}

export default app;
