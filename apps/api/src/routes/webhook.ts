import { Hono } from "hono";
import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { cells, issues, sectors } from "../db/schema";
import { scoreIssue } from "../services/claude";

// Demo cell UUID for Kimironko Cell (override via env if needed).
const DEMO_CELL_ID =
  process.env.DEMO_CELL_ID ?? "573fe872-c863-4e51-9cd7-cc129fc6fa2f";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export const webhookRoutes = new Hono();

webhookRoutes.post("/whatsapp", async (c) => {
  const body = await c.req.parseBody();
  const messageText = String(body["Body"] ?? "").trim();
  const from = String(body["From"] ?? "").trim();

  if (!messageText) {
    c.header("content-type", "text/xml; charset=utf-8");
    return c.body("<Response><Message>Ntitwakiriye ubutumwa bufite amagambo.</Message></Response>", 200);
  }

  let [cell] = await db.select().from(cells).where(eq(cells.id, DEMO_CELL_ID)).limit(1);
  if (!cell) {
    [cell] = await db.select().from(cells).where(eq(cells.name, "Kimironko Cell")).limit(1);
  }
  if (!cell) return c.text("Cell not configured", 500);

  const [sector] = await db
    .select({ name: sectors.name })
    .from(sectors)
    .where(eq(sectors.id, cell.sectorId))
    .limit(1);

  const scored = await scoreIssue(messageText, {
    cellName: cell.name,
    sectorName: sector?.name ?? "Unknown Sector",
  });

  const [created] = await db
    .insert(issues)
    .values({
      cellId: cell.id,
      rawText: messageText,
      submissionChannel: "whatsapp",
      submitterPhone: from || null,
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
    .returning({ id: issues.id, severity: issues.severity });

  const msg = `✅ Murakoze! Ikibazo cyanyu cyakiriwe. / Thank you! Your issue was received.
📋 ID: ${created.id.slice(0, 8)}
⚠️ Agaciro: ${created.severity}/5
Tuzakurikirana ibisubizo.`;

  c.header("content-type", "text/xml; charset=utf-8");
  return c.body(`<Response><Message>${escapeXml(msg)}</Message></Response>`, 200);
});
