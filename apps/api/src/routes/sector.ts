import { Hono } from "hono";
import { and, desc, eq, gte, inArray, lte, ne, or, sql } from "drizzle-orm";

import { db } from "../db/client";
import {
  cells,
  districts,
  issues,
  provinces,
  sectorReports,
  sectors,
  umugandaSessions,
  villages,
} from "../db/schema";

export const sectorRoutes = new Hono();

function monthRange(month: string) {
  const [year, mon] = month.split("-").map(Number);
  const start = new Date(year, mon - 1, 1);
  const end = new Date(year, mon, 0, 23, 59, 59, 999);
  return { start, end, startStr: month };
}

sectorRoutes.get("/overview", async (c) => {
  const sectorId = c.get("sectorId");

  const [hierarchy] = await db
    .select({
      sector: sectors,
      district: districts,
      province: provinces,
    })
    .from(sectors)
    .innerJoin(districts, eq(sectors.districtId, districts.id))
    .innerJoin(provinces, eq(districts.provinceId, provinces.id))
    .where(eq(sectors.id, sectorId))
    .limit(1);

  if (!hierarchy) return c.json({ error: "Sector not found" }, 404);

  const sectorCells = await db.select().from(cells).where(eq(cells.sectorId, sectorId));
  const cellIds = sectorCells.map((row) => row.id);

  if (cellIds.length === 0) {
    return c.json({
      sector: {
        name: hierarchy.sector.name,
        district: hierarchy.district.name,
        province: hierarchy.province.name,
      },
      stats: {
        total_cells: 0,
        reports_received_this_month: 0,
        open_escalations: 0,
        resolved_this_month: 0,
      },
      cells: [],
      escalations: [],
    });
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const openStatuses = ["open", "assigned", "in_progress", "escalated"] as const;

  const cellSummaries = await Promise.all(
    sectorCells.map(async (cell) => {
      const [openCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(issues)
        .where(and(eq(issues.cellId, cell.id), inArray(issues.status, [...openStatuses])));

      const [latestReport] = await db
        .select({
          status: sectorReports.status,
          submittedAt: sectorReports.submittedAt,
        })
        .from(sectorReports)
        .where(eq(sectorReports.cellId, cell.id))
        .orderBy(desc(sectorReports.generatedAt))
        .limit(1);

      const [latestSession] = await db
        .select({
          sessionDate: umugandaSessions.sessionDate,
          status: umugandaSessions.status,
        })
        .from(umugandaSessions)
        .where(eq(umugandaSessions.cellId, cell.id))
        .orderBy(desc(umugandaSessions.sessionDate))
        .limit(1);

      return {
        id: cell.id,
        name: cell.name,
        executive_name: cell.executiveName,
        open_issues: openCount?.count ?? 0,
        last_report_status: latestReport?.status ?? null,
        last_umuganda_date: latestSession?.sessionDate ?? null,
      };
    }),
  );

  const [reportsThisMonth] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sectorReports)
    .innerJoin(cells, eq(sectorReports.cellId, cells.id))
    .where(
      and(
        eq(cells.sectorId, sectorId),
        eq(sectorReports.status, "submitted"),
        gte(sectorReports.submittedAt, monthStart),
      ),
    );

  const [openEscalations] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(issues)
    .where(and(inArray(issues.cellId, cellIds), eq(issues.status, "escalated")));

  const [resolvedThisMonth] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(issues)
    .where(
      and(
        inArray(issues.cellId, cellIds),
        eq(issues.status, "resolved"),
        gte(issues.updatedAt, monthStart),
      ),
    );

  const escalationRows = await db
    .select({
      issue: issues,
      cell_name: cells.name,
      village_name: villages.name,
    })
    .from(issues)
    .innerJoin(cells, eq(issues.cellId, cells.id))
    .leftJoin(villages, eq(issues.villageId, villages.id))
    .where(
      and(
        eq(cells.sectorId, sectorId),
        ne(issues.status, "resolved"),
        or(eq(issues.status, "escalated"), eq(issues.requiresEscalation, true)),
      ),
    )
    .orderBy(desc(issues.severity), desc(issues.updatedAt))
    .limit(10);

  return c.json({
    sector: {
      name: hierarchy.sector.name,
      district: hierarchy.district.name,
      province: hierarchy.province.name,
    },
    stats: {
      total_cells: sectorCells.length,
      reports_received_this_month: reportsThisMonth?.count ?? 0,
      open_escalations: openEscalations?.count ?? 0,
      resolved_this_month: resolvedThisMonth?.count ?? 0,
    },
    cells: cellSummaries,
    escalations: escalationRows,
  });
});

sectorRoutes.get("/reports", async (c) => {
  const sectorId = c.get("sectorId");
  const month = c.req.query("month") ?? new Date().toISOString().slice(0, 7);
  const { startStr, end } = monthRange(month);
  const startDate = `${startStr}-01`;
  const endDate = end.toISOString().slice(0, 10);

  const sectorCells = await db.select().from(cells).where(eq(cells.sectorId, sectorId));

  const rows = await Promise.all(
    sectorCells.map(async (cell) => {
      const sessions = await db
        .select({
          session: umugandaSessions,
          report: sectorReports,
        })
        .from(umugandaSessions)
        .leftJoin(sectorReports, eq(sectorReports.sessionId, umugandaSessions.id))
        .where(
          and(
            eq(umugandaSessions.cellId, cell.id),
            gte(umugandaSessions.sessionDate, startDate),
            lte(umugandaSessions.sessionDate, endDate),
          ),
        )
        .orderBy(desc(umugandaSessions.sessionDate));

      return {
        cell: { id: cell.id, name: cell.name },
        sessions,
      };
    }),
  );

  return c.json({ month, cells: rows });
});

sectorRoutes.get("/reports/:id", async (c) => {
  const sectorId = c.get("sectorId");
  const id = c.req.param("id");

  const [row] = await db
    .select({
      report: sectorReports,
      session: umugandaSessions,
      cell: cells,
    })
    .from(sectorReports)
    .innerJoin(umugandaSessions, eq(sectorReports.sessionId, umugandaSessions.id))
    .innerJoin(cells, eq(sectorReports.cellId, cells.id))
    .where(and(eq(sectorReports.id, id), eq(cells.sectorId, sectorId)))
    .limit(1);

  if (!row) return c.json({ error: "Report not found" }, 404);
  return c.json(row);
});

sectorRoutes.get("/escalations", async (c) => {
  const sectorId = c.get("sectorId");

  const rows = await db
    .select({
      issue: issues,
      cell_name: cells.name,
      village_name: villages.name,
    })
    .from(issues)
    .innerJoin(cells, eq(issues.cellId, cells.id))
    .leftJoin(villages, eq(issues.villageId, villages.id))
    .where(
      and(
        eq(cells.sectorId, sectorId),
        ne(issues.status, "resolved"),
        or(eq(issues.status, "escalated"), eq(issues.requiresEscalation, true)),
      ),
    )
    .orderBy(desc(issues.severity), desc(issues.updatedAt));

  return c.json(rows);
});

sectorRoutes.get("/cells", async (c) => {
  const sectorId = c.get("sectorId");

  const sectorCells = await db.select().from(cells).where(eq(cells.sectorId, sectorId));

  const rows = await Promise.all(
    sectorCells.map(async (cell) => {
      const [villageCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(villages)
        .where(eq(villages.cellId, cell.id));

      const [latestIssue] = await db
        .select({ updatedAt: issues.updatedAt })
        .from(issues)
        .where(eq(issues.cellId, cell.id))
        .orderBy(desc(issues.updatedAt))
        .limit(1);

      const [latestSession] = await db
        .select({ sessionDate: umugandaSessions.sessionDate })
        .from(umugandaSessions)
        .where(eq(umugandaSessions.cellId, cell.id))
        .orderBy(desc(umugandaSessions.sessionDate))
        .limit(1);

      return {
        id: cell.id,
        name: cell.name,
        executive_name: cell.executiveName,
        executive_phone: cell.executivePhone,
        village_count: villageCount?.count ?? 0,
        last_activity: latestIssue?.updatedAt ?? latestSession?.sessionDate ?? null,
      };
    }),
  );

  return c.json(rows);
});

sectorRoutes.get("/profile", async (c) => {
  const sectorId = c.get("sectorId");

  const [hierarchy] = await db
    .select({
      sector: sectors,
      district: districts,
      province: provinces,
    })
    .from(sectors)
    .innerJoin(districts, eq(sectors.districtId, districts.id))
    .innerJoin(provinces, eq(districts.provinceId, provinces.id))
    .where(eq(sectors.id, sectorId))
    .limit(1);

  if (!hierarchy) return c.json({ error: "Sector not found" }, 404);

  return c.json({
    sector: {
      id: hierarchy.sector.id,
      name: hierarchy.sector.name,
      official_name: hierarchy.sector.officialName,
      official_phone: hierarchy.sector.officialPhone,
    },
    district: { name: hierarchy.district.name },
    province: { name: hierarchy.province.name },
  });
});
