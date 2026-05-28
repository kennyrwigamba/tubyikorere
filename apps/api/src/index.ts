import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { authMiddleware } from "./middleware/auth";
import { attendanceRoutes } from "./routes/attendance";
import { authRoutes } from "./routes/auth";
import { villagesRoutes } from "./routes/villages";
import { issuesRoutes } from "./routes/issues";
import { reportsRoutes } from "./routes/reports";
import { umugandaRoutes } from "./routes/umuganda";
import { coordinatorRoutes } from "./routes/coordinator";
import { cellsRoutes } from "./routes/cells";
import { webhookRoutes } from "./routes/webhook";
import { sectorRoutes } from "./routes/sector";
import { adminRoutes } from "./routes/admin";
import { cells } from "./db/schema";

type AppVariables = {
  cell?: typeof cells.$inferSelect;
  sectorId?: string;
  isAdmin?: boolean;
};

const app = new Hono<{ Variables: AppVariables }>();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return process.env.CLIENT_URL ?? "*";
      if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) return origin;
      if (/^http:\/\/localhost:\d+$/.test(origin)) return origin;
      return process.env.CLIENT_URL ?? "*";
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
