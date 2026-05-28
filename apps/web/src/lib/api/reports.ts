import axios from "axios";

import { api } from "@/lib/api";
import type { ReportStatus, SessionStatus } from "@/lib/constants";

export type SectorReport = {
  id: string;
  sessionId: string;
  cellId: string;
  reportText: string;
  keyAchievements: string[];
  escalations: string[];
  attendanceRate: string;
  status: ReportStatus;
  generatedAt: string;
  approvedAt: string | null;
  submittedAt: string | null;
};

export type ReportWithSession = {
  report: SectorReport;
  session: {
    id: string;
    cellId: string;
    sessionDate: string;
    expectedParticipants: number;
    actualParticipants: number | null;
    status: SessionStatus;
    planningNotes: string | null;
    createdAt: string;
    updatedAt: string;
  };
};

export type CellReportRow = {
  session: ReportWithSession["session"];
  report: SectorReport | null;
};

export async function fetchCellReports(cellId: string): Promise<CellReportRow[]> {
  const { data } = await api.get<CellReportRow[]>("/api/reports", {
    params: { cell_id: cellId },
  });
  return data;
}

export async function fetchReportBySession(sessionId: string): Promise<ReportWithSession | null> {
  try {
    const { data } = await api.get<ReportWithSession>(`/api/reports/session/${sessionId}`);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function generateSectorReport(sessionId: string): Promise<SectorReport> {
  const { data } = await api.post<SectorReport>("/api/reports/generate", {
    session_id: sessionId,
  });
  return data;
}

export async function submitSectorReport(reportId: string): Promise<SectorReport> {
  const { data } = await api.patch<SectorReport>(`/api/reports/${reportId}/submit`);
  return data;
}
