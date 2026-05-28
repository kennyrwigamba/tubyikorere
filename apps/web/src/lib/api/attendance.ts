import { api } from "@/lib/api";

export type AttendanceRecordRow = {
  record: {
    id: string;
    sessionId: string;
    villageId: string;
    attended: number;
    absent: number;
    recordedBy: string;
    recordedAt: string;
  };
  village_name: string;
};

export type WorkCompletionRow = {
  completion: {
    id: string;
    sessionId: string;
    issueId: string;
    completionStatus: "resolved" | "partial" | "escalated";
    completionNotes: string;
    photoUrl: string | null;
    recordedAt: string;
  };
  issue_summary: string;
};

export async function fetchSessionAttendance(sessionId: string): Promise<AttendanceRecordRow[]> {
  const { data } = await api.get<AttendanceRecordRow[]>(`/api/attendance/${sessionId}`);
  return data;
}

export async function saveVillageAttendance(payload: {
  session_id: string;
  village_id: string;
  village_name?: string;
  attended: number;
  absent: number;
  recorded_by: string;
}): Promise<AttendanceRecordRow["record"]> {
  const { data } = await api.post<AttendanceRecordRow["record"]>("/api/attendance", payload);
  return data;
}

export async function fetchSessionWorkCompletions(sessionId: string): Promise<WorkCompletionRow[]> {
  const { data } = await api.get<WorkCompletionRow[]>(`/api/attendance/${sessionId}/completions`);
  return data;
}

export async function saveWorkCompletion(payload: {
  session_id: string;
  issue_id: string;
  completion_status: "resolved" | "partial" | "escalated";
  completion_notes: string;
  photo_url?: string | null;
}): Promise<WorkCompletionRow["completion"]> {
  const { data } = await api.post<WorkCompletionRow["completion"]>(
    "/api/attendance/work-completion",
    payload,
  );
  return data;
}
