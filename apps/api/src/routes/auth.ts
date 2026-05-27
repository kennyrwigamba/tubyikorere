import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "../db/client";
import { cells, districts, provinces, sectors } from "../db/schema";

const loginSchema = z.object({
  cell_name: z.string().min(1),
  pin: z.string().min(1),
});

export const authRoutes = new Hono();

authRoutes.post("/login", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid request body" }, 400);

  const { cell_name, pin } = parsed.data;

  const [row] = await db
    .select({
      cell_id: cells.id,
      cell_name: cells.name,
      executive_name: cells.executiveName,
      executive_phone: cells.executivePhone,
      pin: cells.pin,
      sector_name: sectors.name,
      district_name: districts.name,
      province_name: provinces.name,
    })
    .from(cells)
    .innerJoin(sectors, eq(cells.sectorId, sectors.id))
    .innerJoin(districts, eq(sectors.districtId, districts.id))
    .innerJoin(provinces, eq(districts.provinceId, provinces.id))
    .where(and(eq(cells.name, cell_name), eq(cells.pin, pin)))
    .limit(1);

  if (!row) return c.json({ error: "Invalid cell name or PIN" }, 401);

  return c.json({
    cell_id: row.cell_id,
    cell_name: row.cell_name,
    executive_name: row.executive_name,
    executive_phone: row.executive_phone,
    sector_name: row.sector_name,
    district_name: row.district_name,
    province_name: row.province_name,
  });
});
