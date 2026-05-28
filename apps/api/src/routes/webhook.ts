import type { Context } from "hono";
import { Hono } from "hono";
import { eq } from "drizzle-orm";

import { DEMO_CELL_ID, DEMO_CELL_NAME } from "../db/demo-config";
import { db } from "../db/client";
import { cells, issues, sectors } from "../db/schema";
import { scoreIssue } from "../services/claude";

const demoCellId = process.env.DEMO_CELL_ID ?? DEMO_CELL_ID;

const MAX_CLAUDE_INPUT_CHARS = 1500;

const EMPTY_BODY_REPLY =
  "Nyamuneka sobanura ikibazo. Please describe the issue.";

const DEFAULT_SCORE = {
  category: "other" as const,
  severity: 3,
  severity_reason: "Could not analyze",
  summary: "",
  recommended_action: "Review manually",
  estimated_participants: 30,
  requires_escalation: false,
  escalation_reason: null as string | null,
  language_detected: "unknown",
};

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function twimlMessage(text: string) {
  return `<Response><Message>${escapeXml(text)}</Message></Response>`;
}

function twimlResponse(c: Context, text: string) {
  c.header("content-type", "text/xml; charset=utf-8");
  return c.body(twimlMessage(text), 200);
}

function normalizeWhatsAppPhone(from: string): string | null {
  const trimmed = from.trim();
  if (!trimmed) return null;
  return trimmed.replace(/^whatsapp:/i, "").trim() || null;
}

function buildConfirmationReply(issueId: string, severity: number) {
  const ref = issueId.slice(0, 8).toUpperCase();
  return `✅ Murakoze! Ikibazo cyanyu cyakiriwe.
Thank you! Your issue has been received.

📋 ID: ${ref}
⚠️ Agaciro / Priority: ${severity}/5

Tuzakurikirana. We will follow up.`;
}

async function resolveDemoCell() {
  let [cell] = await db.select().from(cells).where(eq(cells.id, demoCellId)).limit(1);
  if (!cell) {
    [cell] = await db.select().from(cells).where(eq(cells.name, DEMO_CELL_NAME)).limit(1);
  }
  return cell ?? null;
}

export const webhookRoutes = new Hono();

webhookRoutes.post("/whatsapp", async (c) => {
  try {
    const body = await c.req.parseBody();
    const messageText = String(body["Body"] ?? "").trim();
    const fromRaw = String(body["From"] ?? "").trim();

    if (!messageText) {
      return twimlResponse(c, EMPTY_BODY_REPLY);
    }

    const cell = await resolveDemoCell();
    if (!cell) {
      console.error("WhatsApp webhook: demo cell not found", demoCellId);
      return twimlResponse(
        c,
        "Ikibazo cyakiriwe ariko sisitemu irimo gukora. Your issue was received but the system is temporarily unavailable.",
      );
    }

    const [sector] = await db
      .select({ name: sectors.name })
      .from(sectors)
      .where(eq(sectors.id, cell.sectorId))
      .limit(1);

    const textForClaude = messageText.slice(0, MAX_CLAUDE_INPUT_CHARS);
    const storedText = messageText.slice(0, MAX_CLAUDE_INPUT_CHARS);

    let scored: Awaited<ReturnType<typeof scoreIssue>> = {
      ...DEFAULT_SCORE,
      summary: storedText.slice(0, 100),
    };
    try {
      scored = await scoreIssue(textForClaude, {
        cellName: cell.name,
        sectorName: sector?.name ?? "Unknown Sector",
      });
    } catch (error) {
      console.error("WhatsApp webhook: Claude scoring failed", error);
    }

    const submitterPhone = normalizeWhatsAppPhone(fromRaw);

    const [created] = await db
      .insert(issues)
      .values({
        cellId: cell.id,
        rawText: storedText,
        submissionChannel: "whatsapp",
        submitterPhone,
        languageDetected: scored.language_detected,
        category: scored.category as typeof issues.$inferInsert.category,
        severity: scored.severity,
        severityReason: scored.severity_reason,
        summary: scored.summary || storedText.slice(0, 100),
        recommendedAction: scored.recommended_action,
        estimatedParticipants: scored.estimated_participants,
        requiresEscalation: scored.requires_escalation,
        escalationReason: scored.escalation_reason,
        status: "open",
      })
      .returning({ id: issues.id, severity: issues.severity });

    return twimlResponse(c, buildConfirmationReply(created.id, created.severity));
  } catch (error) {
    console.error("WhatsApp webhook: unhandled error", error);
    return twimlResponse(
      c,
      "Habaye ikosa. Ongera ugerageze. An error occurred — please try again.",
    );
  }
});
