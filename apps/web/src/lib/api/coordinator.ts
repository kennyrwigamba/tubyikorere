import { api } from "@/lib/api";
import type { IssueApiRow } from "@/lib/api/issues";
import type { SessionStatus } from "@/lib/constants";

export type CoordinatorAssignment = {
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

export type CoordinatorHome = {
  village: {
    id: string;
    name: string;
    coordinator_name: string | null;
  };
  next_session: {
    id: string;
    cellId: string;
    sessionDate: string;
    expectedParticipants: number;
    actualParticipants: number | null;
    status: SessionStatus;
    planningNotes: string | null;
  } | null;
  assignment: CoordinatorAssignment | null;
  village_issues: IssueApiRow[];
};

export type CoordinatorAttendanceContext = {
  village: { id: string; name: string };
  session: CoordinatorHome["next_session"];
  attendance: {
    id: string;
    sessionId: string;
    villageId: string;
    attended: number;
    absent: number;
    recordedBy: string;
    recordedAt: string;
  } | null;
  assignment: CoordinatorAssignment | null;
  completion: {
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
  } | null;
};

export type CoordinatorProfile = {
  village: {
    id: string;
    name: string;
    coordinator_name: string | null;
    coordinator_phone: string | null;
  };
  cell: { name: string };
  sector: { name: string };
  district: { name: string };
  province: { name: string };
};

export async function fetchCoordinatorHome(villageId: string): Promise<CoordinatorHome> {
  const { data } = await api.get<CoordinatorHome>("/api/coordinator/home", {
    params: { village_id: villageId },
  });
  return data;
}

export async function fetchCoordinatorAttendance(
  villageId: string,
): Promise<CoordinatorAttendanceContext> {
  const { data } = await api.get<CoordinatorAttendanceContext>("/api/coordinator/attendance", {
    params: { village_id: villageId },
  });
  return data;
}

export async function fetchCoordinatorProfile(villageId: string): Promise<CoordinatorProfile> {
  const { data } = await api.get<CoordinatorProfile>("/api/coordinator/profile", {
    params: { village_id: villageId },
  });
  return data;
}
