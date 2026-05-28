import type { Context, Next } from "hono";
import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { cells, sectors } from "../db/schema";

const PUBLIC_ROUTES = new Set([
  "GET:/health",
  "POST:/webhook/whatsapp",
  "POST:/api/issues",
  "POST:/api/auth/login",
  "POST:/api/auth/change-pin",
  "GET:/api/villages",
]);

function isPublicRoute(method: string, path: string) {
  if (PUBLIC_ROUTES.has(`${method}:${path}`)) return true;
  if (method === "POST" && /^\/api\/issues\/[0-9a-fA-F-]+\/photo$/.test(path)) return true;
  if (method === "GET" && path.startsWith("/api/issues/track/")) return true;
  if (method === "GET" && path.startsWith("/api/locations/")) return true;
  return false;
}

const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN ?? "tubyikorere-dev-admin";

export async function authMiddleware(c: Context, next: Next) {
  if (isPublicRoute(c.req.method, c.req.path)) {
    await next();
    return;
  }

  const adminToken = c.req.header("x-admin-token");
  if (adminToken && adminToken === ADMIN_API_TOKEN) {
    c.set("isAdmin", true);
    await next();
    return;
  }

  const sectorId = c.req.header("x-sector-id");
  if (sectorId) {
    const [sector] = await db.select().from(sectors).where(eq(sectors.id, sectorId)).limit(1);
    if (!sector) return c.json({ error: "Unauthorized" }, 401);
    c.set("sectorId", sector.id);
    await next();
    return;
  }

  const cellId = c.req.header("x-cell-id");
  if (!cellId) return c.json({ error: "Unauthorized" }, 401);

  const [cell] = await db.select().from(cells).where(eq(cells.id, cellId)).limit(1);
  if (!cell) return c.json({ error: "Unauthorized" }, 401);

  c.set("cell", cell);
  await next();
}
