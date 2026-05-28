import { Hono } from "hono";
import { and, asc, desc, eq, inArray } from "drizzle-orm";

import { db } from "../db/client";
import {
  attendanceRecords,
  cells,
  districts,
  issues,
  provinces,
  sectors,
  sessionAssignments,
  umugandaSessions,
  villages,
  workCompletions,
} from "../db/schema";

export const coordinatorRoutes = new Hono();

async function getVillageForCell(villageId: string, cellId: string) {
  const [village] = await db
    .select()
    .from(villages)
    .where(and(eq(villages.id, villageId), eq(villages.cellId, cellId)))
    .limit(1);
  return village ?? null;
}

async function pickNextSession(cellId: string) {
  const sessions = await db
    .select()
    .from(umugandaSessions)
    .where(
      and(
        eq(umugandaSessions.cellId, cellId),
        inArray(umugandaSessions.status, ["planned", "active"]),
      ),
    )
    .orderBy(asc(umugandaSessions.sessionDate));

  return sessions.find((s) => s.status === "active") ?? sessions[0] ?? null;
}

async function getVillageAssignment(sessionId: string, villageId: string) {
  const [row] = await db
    .select({
      assignment: sessionAssignments,
      issue_summary: issues.summary,
      issue_severity: issues.severity,
    })
    .from(sessionAssignments)
    .innerJoin(issues, eq(sessionAssignments.issueId, issues.id))
    .where(and(eq(sessionAssignments.sessionId, sessionId), eq(issues.villageId, villageId)))
    .limit(1);

  return row ?? null;
}

coordinatorRoutes.get("/home", async (c) => {
  const villageId = c.req.query("village_id");
  if (!villageId) return c.json({ error: "village_id is required" }, 400);

  const cell = c.get("cell");
  const village = await getVillageForCell(villageId, cell.id);
  if (!village) return c.json({ error: "Village not found" }, 404);

  const nextSession = await pickNextSession(cell.id);
  const assignment = nextSession
    ? await getVillageAssignment(nextSession.id, villageId)
    : null;

  const villageIssues = await db
    .select({
      issue: issues,
      village_name: villages.name,
    })
    .from(issues)
    .leftJoin(villages, eq(issues.villageId, villages.id))
    .where(eq(issues.villageId, villageId))
    .orderBy(desc(issues.createdAt))
    .limit(20);

  return c.json({
    village: {
      id: village.id,
      name: village.name,
      coordinator_name: village.coordinatorName,
    },
    next_session: nextSession,
    assignment,
    village_issues: villageIssues,
  });
});

coordinatorRoutes.get("/attendance", async (c) => {
  const villageId = c.req.query("village_id");
  if (!villageId) return c.json({ error: "village_id is required" }, 400);

  const cell = c.get("cell");
  const village = await getVillageForCell(villageId, cell.id);
  if (!village) return c.json({ error: "Village not found" }, 404);

  const session = await pickNextSession(cell.id);
  if (!session) {
    return c.json({
      village: { id: village.id, name: village.name },
      session: null,
      attendance: null,
      assignment: null,
      completion: null,
    });
  }

  const [attendance] = await db
    .select()
    .from(attendanceRecords)
    .where(
      and(
        eq(attendanceRecords.sessionId, session.id),
        eq(attendanceRecords.villageId, villageId),
      ),
    )
    .limit(1);

  const assignment = await getVillageAssignment(session.id, villageId);

  let completion = null;
  if (assignment) {
    const [row] = await db
      .select({
        completion: workCompletions,
        issue_summary: issues.summary,
      })
      .from(workCompletions)
      .innerJoin(issues, eq(workCompletions.issueId, issues.id))
      .where(
        and(
          eq(workCompletions.sessionId, session.id),
          eq(workCompletions.issueId, assignment.assignment.issueId),
        ),
      )
      .limit(1);
    completion = row ?? null;
  }

  return c.json({
    village: { id: village.id, name: village.name },
    session,
    attendance: attendance ?? null,
    assignment,
    completion,
  });
});

coordinatorRoutes.get("/profile", async (c) => {
  const villageId = c.req.query("village_id");
  if (!villageId) return c.json({ error: "village_id is required" }, 400);

  const cell = c.get("cell");
  const village = await getVillageForCell(villageId, cell.id);
  if (!village) return c.json({ error: "Village not found" }, 404);

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

  return c.json({
    village: {
      id: village.id,
      name: village.name,
      coordinator_name: village.coordinatorName,
      coordinator_phone: village.coordinatorPhone,
    },
    cell: { name: hierarchy.cell.name },
    sector: { name: hierarchy.sector.name },
    district: { name: hierarchy.district.name },
    province: { name: hierarchy.province.name },
  });
});
