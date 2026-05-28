import { Hono } from "hono";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "../db/client";
import { attendanceRecords, issues, villages, workCompletions, umugandaSessions } from "../db/schema";

const attendanceSchema = z.object({
  session_id: z.string().uuid(),
  village_id: z.string().uuid(),
  village_name: z.string().optional(),
  attended: z.number().int().min(0),
  absent: z.number().int().min(0),
  recorded_by: z.string().min(1),
});

const workCompletionSchema = z.object({
  session_id: z.string().uuid(),
  issue_id: z.string().uuid(),
  completion_status: z.enum(["resolved", "partial", "escalated"]),
  completion_notes: z.string().min(1),
  photo_url: z.string().url().optional().nullable(),
});

export const attendanceRoutes = new Hono();

attendanceRoutes.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = attendanceSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid request body" }, 400);

  const data = parsed.data;
  const [existing] = await db
    .select()
    .from(attendanceRecords)
    .where(and(eq(attendanceRecords.sessionId, data.session_id), eq(attendanceRecords.villageId, data.village_id)))
    .limit(1);

  let saved;
  if (existing) {
    [saved] = await db
      .update(attendanceRecords)
      .set({
        attended: data.attended,
        absent: data.absent,
        recordedBy: data.recorded_by,
        recordedAt: new Date(),
      })
      .where(eq(attendanceRecords.id, existing.id))
      .returning();
  } else {
    [saved] = await db
      .insert(attendanceRecords)
      .values({
        sessionId: data.session_id,
        villageId: data.village_id,
        attended: data.attended,
        absent: data.absent,
        recordedBy: data.recorded_by,
      })
      .returning();
  }

  const total = await db
    .select({ totalAttended: sql<number>`coalesce(sum(${attendanceRecords.attended}), 0)` })
    .from(attendanceRecords)
    .where(eq(attendanceRecords.sessionId, data.session_id));

  await db
    .update(umugandaSessions)
    .set({ actualParticipants: Number(total[0]?.totalAttended ?? 0), updatedAt: new Date() })
    .where(eq(umugandaSessions.id, data.session_id));

  return c.json(saved);
});

attendanceRoutes.get("/:session_id/completions", async (c) => {
  const sessionId = c.req.param("session_id");
  const rows = await db
    .select({
      completion: workCompletions,
      issue_summary: issues.summary,
    })
    .from(workCompletions)
    .innerJoin(issues, eq(workCompletions.issueId, issues.id))
    .where(eq(workCompletions.sessionId, sessionId));

  return c.json(rows);
});

attendanceRoutes.get("/:session_id", async (c) => {
  const sessionId = c.req.param("session_id");
  const rows = await db
    .select({
      record: attendanceRecords,
      village_name: villages.name,
    })
    .from(attendanceRecords)
    .innerJoin(villages, eq(attendanceRecords.villageId, villages.id))
    .where(eq(attendanceRecords.sessionId, sessionId));

  return c.json(rows);
});

attendanceRoutes.post("/work-completion", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = workCompletionSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid request body" }, 400);

  const data = parsed.data;
  const [existing] = await db
    .select()
    .from(workCompletions)
    .where(
      and(
        eq(workCompletions.sessionId, data.session_id),
        eq(workCompletions.issueId, data.issue_id),
      ),
    )
    .limit(1);

  let saved;
  if (existing) {
    [saved] = await db
      .update(workCompletions)
      .set({
        completionStatus: data.completion_status,
        completionNotes: data.completion_notes,
        photoUrl: data.photo_url ?? null,
        recordedAt: new Date(),
      })
      .where(eq(workCompletions.id, existing.id))
      .returning();
  } else {
    [saved] = await db
      .insert(workCompletions)
      .values({
        sessionId: data.session_id,
        issueId: data.issue_id,
        completionStatus: data.completion_status,
        completionNotes: data.completion_notes,
        photoUrl: data.photo_url ?? null,
      })
      .returning();
  }

  const issueStatus =
    parsed.data.completion_status === "partial"
      ? "in_progress"
      : parsed.data.completion_status === "escalated"
        ? "escalated"
        : "resolved";

  await db
    .update(issues)
    .set({
      status: issueStatus,
      resolutionNotes: parsed.data.completion_notes,
      updatedAt: new Date(),
    })
    .where(eq(issues.id, parsed.data.issue_id));

  return c.json(saved, 201);
});
