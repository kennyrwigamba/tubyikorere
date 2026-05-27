import type { Context, Next } from "hono";
import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { cells } from "../db/schema";

const PUBLIC_ROUTES = new Set([
  "GET:/health",
  "POST:/webhook/whatsapp",
  "POST:/api/issues",
  "POST:/api/auth/login",
]);

export async function authMiddleware(c: Context, next: Next) {
  const routeKey = `${c.req.method}:${c.req.path}`;
  if (PUBLIC_ROUTES.has(routeKey)) {
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
