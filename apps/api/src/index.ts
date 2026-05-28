import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { authMiddleware } from "./middleware/auth";
import { attendanceRoutes } from "./routes/attendance";
import { authRoutes } from "./routes/auth";
import { villagesRoutes } from "./routes/villages";
import { locationsRoutes } from "./routes/locations";
import { issuesRoutes } from "./routes/issues";
import { reportsRoutes } from "./routes/reports";
import { umugandaRoutes } from "./routes/umuganda";
import { coordinatorRoutes } from "./routes/coordinator";
import { cellsRoutes } from "./routes/cells";
import { webhookRoutes } from "./routes/webhook";
import { sectorRoutes } from "./routes/sector";
import { adminRoutes } from "./routes/admin";
import type { AppEnv } from "./app-env";

const app = new Hono<AppEnv>();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return process.env.CLIENT_URL?.split(",")[0]?.trim() ?? "*";

      const allowedOrigins = (process.env.CLIENT_URL ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      if (allowedOrigins.includes(origin)) return origin;
      if (/^http:\/\/localhost:\d+$/.test(origin)) return origin;
      if (/^https:\/\/([a-z0-9-]+\.)*vercel\.app$/i.test(origin)) return origin;

      return allowedOrigins[0] ?? "*";
    },
    allowHeaders: ["Content-Type", "x-cell-id", "x-sector-id", "x-admin-token"],
    allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  })
);
app.use("*", authMiddleware);

app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

app.route("/api/auth", authRoutes);
app.route("/api/villages", villagesRoutes);
app.route("/api/locations", locationsRoutes);
app.route("/api/issues", issuesRoutes);
app.route("/api/umuganda", umugandaRoutes);
app.route("/api/attendance", attendanceRoutes);
app.route("/api/reports", reportsRoutes);
app.route("/api/cells", cellsRoutes);
app.route("/api/coordinator", coordinatorRoutes);
app.route("/api/sector", sectorRoutes);
app.route("/api/admin", adminRoutes);
app.route("/webhook", webhookRoutes);

const port = Number(process.env.PORT || 3001);

serve(
  {
    fetch: app.fetch,
    port,
  },
  () => {
    console.log(`API server running on http://localhost:${port}`);
  }
);
