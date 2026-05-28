import { Hono } from "hono";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "../db/client";
import { cells, districts, issues, provinces, sectors, villages } from "../db/schema";
import { scoreIssue } from "../services/claude";
import { uploadIssuePhoto } from "../services/storage";

const createIssueSchema = z.object({
  raw_text: z.string().min(5),
  cell_id: z.string().uuid(),
  village_id: z.string().uuid(),
  submitter_phone: z.string().optional().nullable(),
  submission_channel: z.enum(["web", "whatsapp"]).default("web"),
  photo_url: z.string().url().optional().nullable(),
});

const updateStatusSchema = z.object({
  status: z.enum(["open", "assigned", "in_progress", "resolved", "escalated", "closed"]),
  resolution_notes: z.string().optional().nullable(),
});

export const issuesRoutes = new Hono();

async function resolveLocationContext(cellId: string, villageId: string) {
  const [row] = await db
    .select({
      cellId: cells.id,
      cellName: cells.name,
      sectorName: sectors.name,
      districtName: districts.name,
      provinceName: provinces.name,
      villageName: villages.name,
    })
    .from(villages)
    .innerJoin(cells, eq(villages.cellId, cells.id))
    .innerJoin(sectors, eq(cells.sectorId, sectors.id))
    .innerJoin(districts, eq(sectors.districtId, districts.id))
    .innerJoin(provinces, eq(districts.provinceId, provinces.id))
    .where(and(eq(villages.id, villageId), eq(cells.id, cellId)))
    .limit(1);

  return row ?? null;
}

async function parseCreateIssueRequest(c: {
  req: {
    header: (name: string) => string | undefined;
    json: () => Promise<unknown>;
    parseBody: (options?: { all?: boolean }) => Promise<Record<string, string | File>>;
  };
}) {
  const contentType = c.req.header("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const body = await c.req.parseBody();
    const photo = body.photo instanceof File && body.photo.size > 0 ? body.photo : null;
    let photoUrl: string | null = null;

    if (photo) {
      photoUrl = await uploadIssuePhoto(photo);
    }

    const parsed = createIssueSchema.safeParse({
      raw_text: String(body.raw_text ?? ""),
      cell_id: String(body.cell_id ?? ""),
      village_id: String(body.village_id ?? ""),
      submitter_phone: String(body.submitter_phone ?? "").trim() || null,
      submission_channel: String(body.submission_channel ?? "web"),
      photo_url: photoUrl,
    });

    return parsed;
  }

  const body = await c.req.json().catch(() => null);
  return createIssueSchema.safeParse(body);
}

issuesRoutes.get("/", async (c) => {
  const cellId = c.req.query("cell_id");
  const villageId = c.req.query("village_id");
  const status = c.req.query("status");
  const limit = Number(c.req.query("limit") ?? "50");

  if (!cellId) return c.json({ error: "cell_id is required" }, 400);

  const filters = [eq(issues.cellId, cellId)];
  if (villageId) filters.push(eq(issues.villageId, villageId));
  if (status) filters.push(eq(issues.status, status as typeof issues.$inferSelect.status));

  const rows = await db
    .select({
      issue: issues,
      village_name: villages.name,
    })
    .from(issues)
    .leftJoin(villages, eq(issues.villageId, villages.id))
    .where(and(...filters))
    .orderBy(desc(issues.severity), desc(issues.createdAt))
    .limit(Number.isFinite(limit) ? limit : 50);

  return c.json(rows);
});

function citizenStatusLabel(status: typeof issues.$inferSelect.status) {
  switch (status) {
    case "open":
      return {
        en: "Being reviewed by the cell executive",
        rw: "Irigenzurwa n'umuyobozi w'akagari",
      };
    case "assigned":
      return {
        en: "Assigned to the next umuganda session",
        rw: "Yashyizwe ku muganda uzaza",
      };
    case "in_progress":
      return { en: "Work in progress", rw: "Akazi karimo gukorwa" };
    case "resolved":
      return { en: "Resolved", rw: "Byakemuwe" };
    case "escalated":
      return {
        en: "Escalated to sector level for support",
        rw: "Byoherejwe ku rwego rw'umurenge",
      };
    case "closed":
      return { en: "Closed", rw: "Byafunzwe" };
    default:
      return { en: "Unknown status", rw: "Imiterere itazwi" };
  }
}

issuesRoutes.get("/track/:ref", async (c) => {
  const ref = c.req.param("ref").trim().toLowerCase();
  if (ref.length < 8) {
    return c.json({ error: "Reference must be at least 8 characters" }, 400);
  }

  const isFullUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(ref);
  const whereClause = isFullUuid
    ? eq(issues.id, ref)
    : sql`${issues.id}::text ilike ${`${ref}%`}`;

  const rows = await db
    .select({
      issue: issues,
      village_name: villages.name,
    })
    .from(issues)
    .leftJoin(villages, eq(issues.villageId, villages.id))
    .where(whereClause)
    .limit(2);

  if (rows.length === 0) return c.json({ error: "Issue not found" }, 404);
  if (rows.length > 1) {
    return c.json({ error: "Reference is ambiguous — enter more characters" }, 400);
  }

  const { issue, village_name } = rows[0];
  const labels = citizenStatusLabel(issue.status);

  return c.json({
    reference: issue.id.slice(0, 8),
    id: issue.id,
    status: issue.status,
    status_label_en: labels.en,
    status_label_rw: labels.rw,
    village_name: village_name ?? "Unknown village",
    category: issue.category,
    summary: issue.summary,
    resolution_notes: issue.resolutionNotes,
    submitted_at: issue.createdAt,
    updated_at: issue.updatedAt,
    resolved_at: issue.status === "resolved" || issue.status === "closed" ? issue.updatedAt : null,
  });
});

issuesRoutes.post("/", async (c) => {
  let parsed;
  try {
    parsed = await parseCreateIssueRequest(c);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid upload";
    return c.json({ error: message }, 400);
  }

  if (!parsed.success) {
    return c.json({ error: "Invalid request body", details: parsed.error.flatten() }, 400);
  }

  const payload = parsed.data;
  const location = await resolveLocationContext(payload.cell_id, payload.village_id);
  if (!location) return c.json({ error: "Location not found" }, 404);

  const scored = await scoreIssue(payload.raw_text, {
    cellName: location.cellName,
    sectorName: location.sectorName,
    districtName: location.districtName,
    provinceName: location.provinceName,
    villageName: location.villageName ?? undefined,
    photoUrl: payload.photo_url,
  });

  const [inserted] = await db
    .insert(issues)
    .values({
      cellId: payload.cell_id,
      villageId: payload.village_id,
      rawText: payload.raw_text,
      submissionChannel: payload.submission_channel,
      submitterPhone: payload.submitter_phone ?? null,
      photoUrl: payload.photo_url ?? null,
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

issuesRoutes.post("/:id/photo", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.parseBody();
  const photo = body.photo instanceof File && body.photo.size > 0 ? body.photo : null;
  if (!photo) {
    return c.json({ error: "photo is required" }, 400);
  }

  try {
    const photoUrl = await uploadIssuePhoto(photo);
    const [updated] = await db
      .update(issues)
      .set({
        photoUrl,
        updatedAt: new Date(),
      })
      .where(eq(issues.id, id))
      .returning();

    if (!updated) return c.json({ error: "Issue not found" }, 404);
    return c.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid upload";
    return c.json({ error: message }, 400);
  }
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
