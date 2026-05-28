import { api } from "@/lib/api";
import type { SessionStatus } from "@/lib/constants";

export type UmugandaSession = {
  id: string;
  cellId: string;
  sessionDate: string;
  expectedParticipants: number;
  actualParticipants: number | null;
  status: SessionStatus;
  planningNotes: string | null;
  createdAt: string;
  updatedAt: string;
  assignmentCount: number;
};

export async function fetchCellSessions(cellId: string): Promise<UmugandaSession[]> {
  const { data } = await api.get<UmugandaSession[]>("/api/umuganda", {
    params: { cell_id: cellId },
  });
  return data.map((row) => ({
    ...row,
    assignmentCount: Number(row.assignmentCount ?? 0),
  }));
}

export async function createUmugandaSession(payload: {
  cell_id: string;
  session_date: string;
  expected_participants: number;
}): Promise<UmugandaSession> {
  const { data } = await api.post<UmugandaSession>("/api/umuganda", payload);
  return { ...data, assignmentCount: 0 };
}

/** Last Saturday of the given month. */
function lastSaturdayOfMonth(year: number, monthIndex: number): Date {
  const lastDay = new Date(year, monthIndex + 1, 0);
  const offset = (lastDay.getDay() + 1) % 7;
  lastDay.setDate(lastDay.getDate() - offset);
  return lastDay;
}

/** Next umuganda date (last Saturday of current or next month). */
export function getNextUmugandaDate(from = new Date()): string {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  let candidate = lastSaturdayOfMonth(today.getFullYear(), today.getMonth());
  if (candidate < today) {
    candidate = lastSaturdayOfMonth(today.getFullYear(), today.getMonth() + 1);
  }
  return candidate.toISOString().slice(0, 10);
}

export function splitSessionsByUpcoming(sessions: UmugandaSession[]) {
  const upcoming = sessions
    .filter((s) => s.status !== "completed")
    .sort((a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime());

  const past = sessions
    .filter((s) => s.status === "completed")
    .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());

  return { upcoming, past };
}

export function sessionDetailPath(session: UmugandaSession) {
  if (session.status === "completed" || session.status === "active") {
    return `/cell-executive/umuganda/${session.id}/attendance`;
  }
  return `/cell-executive/umuganda/${session.id}/plan`;
}

export async function confirmSessionPlan(sessionId: string): Promise<UmugandaSession> {
  const { data } = await api.patch<UmugandaSession>(`/api/umuganda/${sessionId}/confirm`);
  return data;
}

export async function completeSession(sessionId: string): Promise<UmugandaSession> {
  const { data } = await api.patch<UmugandaSession>(`/api/umuganda/${sessionId}/complete`);
  return data;
}

export type SessionAssignmentRow = {
  assignment: {
    id: string;
    sessionId: string;
    issueId: string;
    groupName: string;
    assignedParticipants: number;
    estimatedHours: string;
    taskDescription: string;
    materialsNeeded: string | null;
    displayOrder: number;
  };
  issue_summary: string;
  issue_severity: number;
};

export type SessionDetail = {
  session: Omit<UmugandaSession, "assignmentCount">;
  assignments: SessionAssignmentRow[];
};

export type GeneratePlanResult = {
  session: SessionDetail["session"];
  assignments: Array<{
    group_name: string;
    issue_id: string;
    issue_summary: string;
    assigned_participants: number;
    estimated_hours: number;
    task_description: string;
    materials_needed: string | null;
    display_order: number;
  }>;
  planning_notes: string;
  unassigned_issue_ids: string[];
  unassigned_reason?: string | null;
};

export async function fetchSessionDetail(sessionId: string): Promise<SessionDetail> {
  const { data } = await api.get<SessionDetail>(`/api/umuganda/${sessionId}`);
  return data;
}

export async function generateSessionPlan(sessionId: string): Promise<GeneratePlanResult> {
  const { data } = await api.post<GeneratePlanResult>(`/api/umuganda/${sessionId}/plan`);
  return data;
}

export function groupLetter(groupName: string, displayOrder: number): string {
  const match = groupName.match(/([A-Z])/i);
  if (match) return match[1].toUpperCase();
  return String.fromCharCode(64 + displayOrder);
}
