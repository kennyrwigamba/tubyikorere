import { Hono } from "hono";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { db } from "../db/client";
import {
  attendanceRecords,
  cells,
  districts,
  issues,
  sectorReports,
  sectors,
  sessionAssignments,
  umugandaSessions,
  workCompletions,
} from "../db/schema";
import { generateReport } from "../services/claude";

const generateSchema = z.object({
  session_id: z.string().uuid(),
});

export const reportsRoutes = new Hono();

reportsRoutes.post("/generate", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid request body" }, 400);

  const sessionId = parsed.data.session_id;

  const [session] = await db
    .select()
    .from(umugandaSessions)
    .where(eq(umugandaSessions.id, sessionId))
    .limit(1);
  if (!session) return c.json({ error: "Session not found" }, 404);

  const [cellHierarchy] = await db
    .select({
      cell: cells,
      sector: sectors,
      district: districts,
    })
    .from(cells)
    .innerJoin(sectors, eq(cells.sectorId, sectors.id))
    .innerJoin(districts, eq(sectors.districtId, districts.id))
    .where(eq(cells.id, session.cellId))
    .limit(1);

  const attendance = await db
    .select()
    .from(attendanceRecords)
    .where(eq(attendanceRecords.sessionId, sessionId));

  const completions = await db
    .select({
      completion: workCompletions,
      issue: issues,
    })
    .from(workCompletions)
    .innerJoin(issues, eq(workCompletions.issueId, issues.id))
    .where(eq(workCompletions.sessionId, sessionId));

  const assignmentIssueIds = await db
    .select({ issueId: sessionAssignments.issueId })
    .from(sessionAssignments)
    .where(eq(sessionAssignments.sessionId, sessionId));

  const issueIds = assignmentIssueIds.map((r) => r.issueId);
  const sessionIssues =
    issueIds.length > 0
      ? await db.select().from(issues).where(inArray(issues.id, issueIds))
      : [];

  const reportPayload = {
    session,
    cell: cellHierarchy?.cell,
    sector: cellHierarchy?.sector,
    district: cellHierarchy?.district,
    attendanceRecords: attendance,
    workCompletions: completions,
    issues: sessionIssues,
  };

  const generated = await generateReport(reportPayload);

  const [existing] = await db
    .select()
    .from(sectorReports)
    .where(eq(sectorReports.sessionId, sessionId))
    .limit(1);

  let saved;
  if (existing) {
    [saved] = await db
      .update(sectorReports)
      .set({
        reportText: generated.report_text,
        keyAchievements: generated.key_achievements,
        escalations: generated.escalations,
        attendanceRate: String(generated.attendance_rate ?? 0),
        status: "draft",
        generatedAt: new Date(),
        approvedAt: null,
        submittedAt: null,
      })
      .where(eq(sectorReports.id, existing.id))
      .returning();
  } else {
    [saved] = await db
      .insert(sectorReports)
      .values({
        sessionId,
        cellId: session.cellId,
        reportText: generated.report_text,
        keyAchievements: generated.key_achievements,
        escalations: generated.escalations,
        attendanceRate: String(generated.attendance_rate ?? 0),
        status: "draft",
      })
      .returning();
  }

  return c.json(saved, 201);
});

reportsRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const [row] = await db
    .select({
      report: sectorReports,
      session: umugandaSessions,
    })
    .from(sectorReports)
    .innerJoin(umugandaSessions, eq(sectorReports.sessionId, umugandaSessions.id))
    .where(eq(sectorReports.id, id))
    .limit(1);

  if (!row) return c.json({ error: "Report not found" }, 404);
  return c.json(row);
});

reportsRoutes.patch("/:id/approve", async (c) => {
  const id = c.req.param("id");
  const [updated] = await db
    .update(sectorReports)
    .set({
      status: "approved",
      approvedAt: new Date(),
    })
    .where(eq(sectorReports.id, id))
    .returning();

  if (!updated) return c.json({ error: "Report not found" }, 404);
  return c.json(updated);
});
