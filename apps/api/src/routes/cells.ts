import { Hono } from "hono";
import { eq, asc } from "drizzle-orm";

import { db } from "../db/client";
import { cells, districts, provinces, sectors, villages } from "../db/schema";

export const cellsRoutes = new Hono();

cellsRoutes.get("/profile", async (c) => {
  const cell = c.get("cell");

  const [hierarchy] = await db
    .select({
      cell: cells,
      sector: sectors,
      district: districts,
      province: provinces,
    })
    .from(cells)
    .innerJoin(sectors, eq(cells.sectorId, sectors.id))
    .innerJoin(districts, eq(sectors.districtId, districts.id))
    .innerJoin(provinces, eq(districts.provinceId, provinces.id))
    .where(eq(cells.id, cell.id))
    .limit(1);

  if (!hierarchy) return c.json({ error: "Cell not found" }, 404);

  const villageRows = await db
    .select({
      id: villages.id,
      name: villages.name,
      coordinator_name: villages.coordinatorName,
    })
    .from(villages)
    .where(eq(villages.cellId, cell.id))
    .orderBy(asc(villages.name));

  return c.json({
    cell: {
      id: hierarchy.cell.id,
      name: hierarchy.cell.name,
      executive_name: hierarchy.cell.executiveName,
      executive_phone: hierarchy.cell.executivePhone,
    },
    sector: { name: hierarchy.sector.name },
    district: { name: hierarchy.district.name },
    province: { name: hierarchy.province.name },
    villages: villageRows,
  });
});
