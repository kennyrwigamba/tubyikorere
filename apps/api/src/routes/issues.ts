import { Hono } from "hono";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "../db/client";
import { cells, issues, sectors, villages } from "../db/schema";
import { scoreIssue } from "../services/claude";

const createIssueSchema = z.object({
  raw_text: z.string().min(5),
  cell_id: z.string().uuid(),
  village_id: z.string().uuid().optional().nullable(),
  submitter_phone: z.string().optional().nullable(),
  submission_channel: z.enum(["web", "whatsapp"]).default("web"),
});

const updateStatusSchema = z.object({
  status: z.enum(["open", "assigned", "in_progress", "resolved", "escalated", "closed"]),
  resolution_notes: z.string().optional().nullable(),
});

export const issuesRoutes = new Hono();

issuesRoutes.get("/", async (c) => {
  const cellId = c.req.query("cell_id");
  const status = c.req.query("status");
  const limit = Number(c.req.query("limit") ?? "50");

  if (!cellId) return c.json({ error: "cell_id is required" }, 400);

  const query = db
    .select({
      issue: issues,
      village_name: villages.name,
    })
    .from(issues)
    .leftJoin(villages, eq(issues.villageId, villages.id))
    .where(status ? and(eq(issues.cellId, cellId), eq(issues.status, status as typeof issues.$inferSelect.status)) : eq(issues.cellId, cellId))
    .orderBy(desc(issues.severity), desc(issues.createdAt))
    .limit(Number.isFinite(limit) ? limit : 50);

  const rows = await query;
  return c.json(rows);
});

issuesRoutes.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createIssueSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid request body", details: parsed.error.flatten() }, 400);

  const payload = parsed.data;
  const [cell] = await db
    .select({
      id: cells.id,
      name: cells.name,
      sectorName: sectors.name,
    })
    .from(cells)
    .innerJoin(sectors, eq(cells.sectorId, sectors.id))
    .where(eq(cells.id, payload.cell_id))
    .limit(1);

  if (!cell) return c.json({ error: "Cell not found" }, 404);

  const scored = await scoreIssue(payload.raw_text, {
    cellName: cell.name,
    sectorName: cell.sectorName,
  });

  const [inserted] = await db
    .insert(issues)
    .values({
      cellId: payload.cell_id,
      villageId: payload.village_id ?? null,
      rawText: payload.raw_text,
      submissionChannel: payload.submission_channel,
      submitterPhone: payload.submitter_phone ?? null,
      languageDetected: scored.language_detected,
      category: scored.category as typeof issues.$inferInsert.category,
      severity: scored.severity,
      severityReason: scored.severity_reason,
      summary: scored.summary,
      recommendedAction: scored.recommended_action,
      estimatedParticipants: scored.estimated_participants,
      requiresEscalation: scored.requires_escalation,
      escalationReason: scored.escalation_reason,
      status: "open",
    })
    .returning();

  return c.json(inserted, 201);
});

issuesRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const [row] = await db
    .select({
      issue: issues,
      village_name: villages.name,
    })
    .from(issues)
    .leftJoin(villages, eq(issues.villageId, villages.id))
    .where(eq(issues.id, id))
    .limit(1);

  if (!row) return c.json({ error: "Issue not found" }, 404);
  return c.json(row);
});

issuesRoutes.patch("/:id/status", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const parsed = updateStatusSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid request body" }, 400);

  const [updated] = await db
    .update(issues)
    .set({
      status: parsed.data.status,
      resolutionNotes: parsed.data.resolution_notes ?? null,
      updatedAt: new Date(),
    })
    .where(eq(issues.id, id))
    .returning();

  if (!updated) return c.json({ error: "Issue not found" }, 404);
  return c.json(updated);
});
