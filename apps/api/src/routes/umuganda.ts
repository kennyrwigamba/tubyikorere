import { Hono } from "hono";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "../db/client";
import { issues, sessionAssignments, umugandaSessions } from "../db/schema";
import { planUmugandaSession } from "../services/claude";

const createSessionSchema = z.object({
  cell_id: z.string().uuid(),
  session_date: z.string().min(1),
  expected_participants: z.number().int().positive(),
});

export const umugandaRoutes = new Hono();

umugandaRoutes.get("/", async (c) => {
  const cellId = c.req.query("cell_id");
  if (!cellId) return c.json({ error: "cell_id is required" }, 400);

  const rows = await db
    .select({
      id: umugandaSessions.id,
      cellId: umugandaSessions.cellId,
      sessionDate: umugandaSessions.sessionDate,
      expectedParticipants: umugandaSessions.expectedParticipants,
      actualParticipants: umugandaSessions.actualParticipants,
      status: umugandaSessions.status,
      planningNotes: umugandaSessions.planningNotes,
      createdAt: umugandaSessions.createdAt,
      updatedAt: umugandaSessions.updatedAt,
      assignmentCount: sql<number>`cast(count(${sessionAssignments.id}) as int)`,
    })
    .from(umugandaSessions)
    .leftJoin(sessionAssignments, eq(sessionAssignments.sessionId, umugandaSessions.id))
    .where(eq(umugandaSessions.cellId, cellId))
    .groupBy(
      umugandaSessions.id,
      umugandaSessions.cellId,
      umugandaSessions.sessionDate,
      umugandaSessions.expectedParticipants,
      umugandaSessions.actualParticipants,
      umugandaSessions.status,
      umugandaSessions.planningNotes,
      umugandaSessions.createdAt,
      umugandaSessions.updatedAt,
    )
    .orderBy(desc(umugandaSessions.sessionDate));

  return c.json(rows);
});

umugandaRoutes.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createSessionSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid request body" }, 400);

  const [session] = await db
    .insert(umugandaSessions)
    .values({
      cellId: parsed.data.cell_id,
      sessionDate: parsed.data.session_date,
      expectedParticipants: parsed.data.expected_participants,
      status: "planned",
    })
    .returning();

  return c.json(session, 201);
});

umugandaRoutes.post("/:id/plan", async (c) => {
  const sessionId = c.req.param("id");
  const [session] = await db
    .select()
    .from(umugandaSessions)
    .where(eq(umugandaSessions.id, sessionId))
    .limit(1);

  if (!session) return c.json({ error: "Session not found" }, 404);

  const [existingAssignment] = await db
    .select({ id: sessionAssignments.id })
    .from(sessionAssignments)
    .where(eq(sessionAssignments.sessionId, sessionId))
    .limit(1);

  if (existingAssignment) {
    return c.json({ error: "Work plan already generated for this session" }, 409);
  }

  const openIssues = await db
    .select({
      id: issues.id,
      severity: issues.severity,
      summary: issues.summary,
      estimated_participants: issues.estimatedParticipants,
    })
    .from(issues)
    .where(and(eq(issues.cellId, session.cellId), eq(issues.status, "open")))
    .orderBy(desc(issues.severity), desc(issues.createdAt));

  const planned = await planUmugandaSession(
    openIssues,
    session.expectedParticipants,
    session.sessionDate
  );

  if (planned.assignments.length > 0) {
    await db.insert(sessionAssignments).values(
      planned.assignments.map((a) => ({
        sessionId: session.id,
        issueId: a.issue_id,
        groupName: a.group_name,
        assignedParticipants: a.assigned_participants,
        estimatedHours: String(a.estimated_hours),
        taskDescription: a.task_description,
        materialsNeeded: a.materials_needed ?? null,
        displayOrder: a.display_order,
      }))
    );

    const assignedIds = planned.assignments.map((a) => a.issue_id);
    await db
      .update(issues)
      .set({
        status: "assigned",
        umugandaSessionId: session.id,
        updatedAt: new Date(),
      })
      .where(inArray(issues.id, assignedIds));
  }

  await db
    .update(umugandaSessions)
    .set({
      planningNotes: planned.planning_notes,
      updatedAt: new Date(),
    })
    .where(eq(umugandaSessions.id, session.id));

  const [updatedSession] = await db
    .select()
    .from(umugandaSessions)
    .where(eq(umugandaSessions.id, session.id))
    .limit(1);

  return c.json({
    session: updatedSession ?? session,
    assignments: planned.assignments,
    planning_notes: planned.planning_notes,
    unassigned_issue_ids: planned.unassigned_issue_ids,
    unassigned_reason: planned.unassigned_reason ?? null,
  });
});

umugandaRoutes.get("/:id", async (c) => {
  const sessionId = c.req.param("id");
  const [session] = await db
    .select()
    .from(umugandaSessions)
    .where(eq(umugandaSessions.id, sessionId))
    .limit(1);

  if (!session) return c.json({ error: "Session not found" }, 404);

  const assignments = await db
    .select({
      assignment: sessionAssignments,
      issue_summary: issues.summary,
      issue_severity: issues.severity,
    })
    .from(sessionAssignments)
    .innerJoin(issues, eq(sessionAssignments.issueId, issues.id))
    .where(eq(sessionAssignments.sessionId, sessionId))
    .orderBy(sessionAssignments.displayOrder);

  return c.json({ session, assignments });
});

umugandaRoutes.patch("/:id/confirm", async (c) => {
  const sessionId = c.req.param("id");
  const [session] = await db
    .select()
    .from(umugandaSessions)
    .where(eq(umugandaSessions.id, sessionId))
    .limit(1);

  if (!session) return c.json({ error: "Session not found" }, 404);
  if (session.status === "completed") {
    return c.json({ error: "Session is already completed" }, 400);
  }

  const [assignment] = await db
    .select({ id: sessionAssignments.id })
    .from(sessionAssignments)
    .where(eq(sessionAssignments.sessionId, sessionId))
    .limit(1);

  if (!assignment) {
    return c.json({ error: "Generate a work plan before confirming" }, 400);
  }

  const [updated] = await db
    .update(umugandaSessions)
    .set({ status: "active", updatedAt: new Date() })
    .where(eq(umugandaSessions.id, sessionId))
    .returning();

  return c.json(updated);
});

umugandaRoutes.patch("/:id/complete", async (c) => {
  const sessionId = c.req.param("id");
  const [session] = await db
    .select()
    .from(umugandaSessions)
    .where(eq(umugandaSessions.id, sessionId))
    .limit(1);

  if (!session) return c.json({ error: "Session not found" }, 404);
  if (session.status === "completed") return c.json(session);

  const [updated] = await db
    .update(umugandaSessions)
    .set({ status: "completed", updatedAt: new Date() })
    .where(eq(umugandaSessions.id, sessionId))
    .returning();

  return c.json(updated);
});
