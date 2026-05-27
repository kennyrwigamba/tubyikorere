import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { authMiddleware } from "./middleware/auth";
import { attendanceRoutes } from "./routes/attendance";
import { authRoutes } from "./routes/auth";
import { issuesRoutes } from "./routes/issues";
import { reportsRoutes } from "./routes/reports";
import { umugandaRoutes } from "./routes/umuganda";
import { webhookRoutes } from "./routes/webhook";
import { cells } from "./db/schema";

type AppVariables = {
  cell: typeof cells.$inferSelect;
};

const app = new Hono<{ Variables: AppVariables }>();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: process.env.CLIENT_URL || "*",
    allowHeaders: ["Content-Type", "x-cell-id"],
    allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  })
);
app.use("*", authMiddleware);

app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

app.route("/api/auth", authRoutes);
app.route("/api/issues", issuesRoutes);
app.route("/api/umuganda", umugandaRoutes);
app.route("/api/attendance", attendanceRoutes);
app.route("/api/reports", reportsRoutes);
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
