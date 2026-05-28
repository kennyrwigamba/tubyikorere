import { Hono } from "hono";
import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { villages } from "../db/schema";

export const villagesRoutes = new Hono();

villagesRoutes.get("/", async (c) => {
  const cellId = c.req.query("cell_id");
  if (!cellId) return c.json({ error: "cell_id is required" }, 400);

  const rows = await db
    .select({
      id: villages.id,
      name: villages.name,
      name_kinyarwanda: villages.nameKinyarwanda,
      cell_id: villages.cellId,
      coordinator_name: villages.coordinatorName,
    })
    .from(villages)
    .where(eq(villages.cellId, cellId));

  return c.json(rows);
});
