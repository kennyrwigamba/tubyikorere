import { Hono } from "hono";
import { asc, eq } from "drizzle-orm";

import { db } from "../db/client";
import { cells, districts, provinces, sectors, villages } from "../db/schema";

export const locationsRoutes = new Hono();

locationsRoutes.get("/provinces", async (c) => {
  const rows = await db
    .select({
      id: provinces.id,
      name: provinces.name,
      name_kinyarwanda: provinces.nameKinyarwanda,
    })
    .from(provinces)
    .orderBy(asc(provinces.name));

  return c.json(rows);
});

locationsRoutes.get("/districts", async (c) => {
  const provinceId = c.req.query("province_id");
  if (!provinceId) return c.json({ error: "province_id is required" }, 400);

  const rows = await db
    .select({
      id: districts.id,
      name: districts.name,
      name_kinyarwanda: districts.nameKinyarwanda,
    })
    .from(districts)
    .where(eq(districts.provinceId, provinceId))
    .orderBy(asc(districts.name));

  return c.json(rows);
});

locationsRoutes.get("/sectors", async (c) => {
  const districtId = c.req.query("district_id");
  if (!districtId) return c.json({ error: "district_id is required" }, 400);

  const rows = await db
    .select({
      id: sectors.id,
      name: sectors.name,
      name_kinyarwanda: sectors.nameKinyarwanda,
    })
    .from(sectors)
    .where(eq(sectors.districtId, districtId))
    .orderBy(asc(sectors.name));

  return c.json(rows);
});

locationsRoutes.get("/cells", async (c) => {
  const sectorId = c.req.query("sector_id");
  if (!sectorId) return c.json({ error: "sector_id is required" }, 400);

  const rows = await db
    .select({
      id: cells.id,
      name: cells.name,
      name_kinyarwanda: cells.nameKinyarwanda,
    })
    .from(cells)
    .where(eq(cells.sectorId, sectorId))
    .orderBy(asc(cells.name));

  return c.json(rows);
});

locationsRoutes.get("/villages", async (c) => {
  const cellId = c.req.query("cell_id");
  if (!cellId) return c.json({ error: "cell_id is required" }, 400);

  const rows = await db
    .select({
      id: villages.id,
      name: villages.name,
      name_kinyarwanda: villages.nameKinyarwanda,
    })
    .from(villages)
    .where(eq(villages.cellId, cellId))
    .orderBy(asc(villages.name));

  return c.json(rows);
});
