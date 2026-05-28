import Anthropic from "@anthropic-ai/sdk";

// Haiku 4.5 — cheaper for local/testing. Override via ANTHROPIC_MODEL.
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001";

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

type ScoreIssueContext = {
  cellName: string;
  sectorName: string;
};

type ScoredIssueInput = {
  id: string;
  severity: number;
  summary: string;
  estimated_participants: number;
};

type SessionDataInput = {
  session: unknown;
  cell: unknown;
  sector: unknown;
  district: unknown;
  attendanceRecords: unknown[];
  workCompletions: unknown[];
  issues: unknown[];
};

type RecentIssueInput = {
  category: string;
  summary: string;
  village_name: string | null;
};

function getTextFromResponse(
  response: Awaited<ReturnType<Anthropic["messages"]["create"]>>
) {
  if (!("content" in response) || !Array.isArray(response.content)) return "";
  const textBlock = response.content.find(
    (block: { type: string }) => block.type === "text"
  );
  return textBlock && "text" in textBlock ? String(textBlock.text) : "";
}

function extractJsonText(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```\s*$/i);
  if (fenced) return fenced[1].trim();
  return trimmed;
}

function safeJsonParse<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(extractJsonText(text)) as T;
  } catch {
    return fallback;
  }
}

export async function scoreIssue(rawText: string, context: ScoreIssueContext) {
  const fallback = {
    category: "other",
    severity: 3,
    severity_reason: "Could not analyze",
    summary: rawText.slice(0, 100),
    recommended_action: "Review manually",
    estimated_participants: 30,
    requires_escalation: false,
    escalation_reason: null as string | null,
    language_detected: "unknown",
  };

  if (!anthropic) return fallback;

  const prompt = `
You are analyzing a citizen issue for Rwanda's community governance platform Tubikorere.
Kinyarwanda text is expected and must be processed correctly.

Context:
- Cell: ${context.cellName}
- Sector: ${context.sectorName}

Severity rubric:
- 5 = immediate safety risk
- 4 = major daily life impact
- 3 = significant inconvenience
- 2 = minor infrastructure issue
- 1 = cosmetic issue

Return ONLY valid JSON (no markdown, no code blocks, no preamble) with this exact shape:
{
  "category": "infrastructure|water|health|education|environment|safety|other",
  "severity": number,
  "severity_reason": string,
  "summary": string,
  "recommended_action": string,
  "estimated_participants": number,
  "requires_escalation": boolean,
  "escalation_reason": string|null,
  "language_detected": string
}

Citizen text:
${rawText}
`.trim();

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 700,
      messages: [{ role: "user", content: prompt }],
    });
    return safeJsonParse(getTextFromResponse(response), fallback);
  } catch {
    return fallback;
  }
}

export async function planUmugandaSession(
  issues: ScoredIssueInput[],
  expectedParticipants: number,
  sessionDate: string
) {
  const buildFallback = () => {
    const sorted = [...issues].sort((a, b) => b.severity - a.severity);
    const assignments: Array<{
      group_name: string;
      issue_id: string;
      issue_summary: string;
      assigned_participants: number;
      estimated_hours: number;
      task_description: string;
      materials_needed: string | null;
      display_order: number;
    }> = [];

    let remaining = expectedParticipants;
    let order = 1;
    for (const issue of sorted) {
      if (remaining < 20) break;
      const participants = Math.max(20, Math.min(issue.estimated_participants || 20, remaining));
      assignments.push({
        group_name: `Group ${String.fromCharCode(64 + order)}`,
        issue_id: issue.id,
        issue_summary: issue.summary,
        assigned_participants: participants,
        estimated_hours: 3,
        task_description:
          "Assemble workers, inspect the site, divide tasks, execute repairs safely, and record completion notes for the cell executive.",
        materials_needed: "Basic tools and protective equipment",
        display_order: order,
      });
      remaining -= participants;
      order += 1;
    }

    const assignedIds = new Set(assignments.map((a) => a.issue_id));
    return {
      assignments,
      planning_notes:
        assignments.length > 0
          ? `Fallback planning generated ${assignments.length} assignment groups for ${sessionDate}.`
          : "Automatic planning unavailable. Review and assign manually.",
      unassigned_issue_ids: sorted.filter((i) => !assignedIds.has(i.id)).map((i) => i.id),
      unassigned_reason:
        remaining < 20
          ? "Insufficient remaining participants for another viable group"
          : "Automatic planner unavailable",
    };
  };
  const fallback = buildFallback();

  if (!anthropic) return fallback;

  const prompt = `
You are planning an Umuganda work session for Rwanda's community governance platform.

Session date: ${sessionDate}
Expected participants: ${expectedParticipants}

Rules:
- Prioritize strictly by severity descending.
- Minimum 20 participants per group.
- Task descriptions must be actionable and specific for a village coordinator, not an engineer.
- Be realistic: not all issues can fit in one session.

Input issues (already scored):
${JSON.stringify(issues)}

Return ONLY valid JSON (no markdown, no code blocks, no preamble) in this exact shape:
{
  "assignments": [
    {
      "group_name": string,
      "issue_id": string,
      "issue_summary": string,
      "assigned_participants": number,
      "estimated_hours": number,
      "task_description": string,
      "materials_needed": string|null,
      "display_order": number
    }
  ],
  "planning_notes": string,
  "unassigned_issue_ids": string[],
  "unassigned_reason": string
}
`.trim();

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });
    return safeJsonParse(getTextFromResponse(response), fallback);
  } catch {
    return fallback;
  }
}

export async function generateReport(sessionData: SessionDataInput) {
  const fallback = {
    report_text:
      "Tubikorere report draft could not be generated automatically. Please compile attendance, completed work, and escalation details manually for submission.",
    key_achievements: ["Automatic report generation unavailable"],
    escalations: [] as string[],
    attendance_rate: 0,
  };

  if (!anthropic) return fallback;

  const prompt = `
Generate a monthly Umuganda report for Rwanda's community governance platform.

Requirements:
- Audience: Sector Executive Secretary
- Tone: formal Rwandan government style (factual, respectful, structured)
- Structure: Opening -> Attendance by village -> Work completed -> Outstanding issues -> Escalations -> Closing
- Length: 350-450 words

Input session data:
${JSON.stringify(sessionData)}

Return ONLY valid JSON (no markdown, no code blocks, no preamble):
{
  "report_text": string,
  "key_achievements": string[],
  "escalations": string[],
  "attendance_rate": number
}
`.trim();

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2200,
      messages: [{ role: "user", content: prompt }],
    });
    return safeJsonParse(getTextFromResponse(response), fallback);
  } catch {
    return fallback;
  }
}

export async function detectPatterns(recentIssues: RecentIssueInput[]) {
  const fallback = {
    patterns: [] as Array<{
      pattern_description: string;
      affected_villages: string[];
      recommended_escalation: string;
      severity_assessment: string;
    }>,
  };

  if (!anthropic) return fallback;

  const prompt = `
Analyze recent community issues from the last 30 days for significant patterns.
If no significant pattern exists, return an empty patterns array.

Input issues:
${JSON.stringify(recentIssues)}

Return ONLY valid JSON (no markdown, no code blocks, no preamble):
{
  "patterns": [
    {
      "pattern_description": string,
      "affected_villages": string[],
      "recommended_escalation": string,
      "severity_assessment": string
    }
  ]
}
`.trim();

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    });
    return safeJsonParse(getTextFromResponse(response), fallback);
  } catch {
    return fallback;
  }
}
