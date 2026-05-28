import { api } from "@/lib/api";
import type { IssueApiRow } from "@/lib/api/issues";
import type { ReportStatus, SessionStatus } from "@/lib/constants";
import type { SectorReport } from "@/lib/api/reports";

export type SectorOverview = {
  sector: {
    name: string;
    district: string;
    province: string;
  };
  stats: {
    total_cells: number;
    reports_received_this_month: number;
    open_escalations: number;
    resolved_this_month: number;
  };
  cells: {
    id: string;
    name: string;
    executive_name: string | null;
    open_issues: number;
    last_report_status: ReportStatus | null;
    last_umuganda_date: string | null;
  }[];
  escalations: IssueApiRow[];
};

export type SectorReportsByCell = {
  month: string;
  cells: {
    cell: { id: string; name: string };
    sessions: {
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
      report: SectorReport | null;
    }[];
  }[];
};

export type SectorReportDetail = {
  report: SectorReport;
  session: SectorReportsByCell["cells"][0]["sessions"][0]["session"];
  cell: { id: string; name: string; executiveName: string | null };
};

export type SectorCellRow = {
  id: string;
  name: string;
  executive_name: string | null;
  executive_phone: string | null;
  village_count: number;
  last_activity: string | null;
};

export type SectorProfile = {
  sector: {
    id: string;
    name: string;
    official_name: string | null;
    official_phone: string | null;
  };
  district: { name: string };
  province: { name: string };
};

export async function fetchSectorOverview(): Promise<SectorOverview> {
  const { data } = await api.get<SectorOverview>("/api/sector/overview");
  return data;
}

export async function fetchSectorReports(month: string): Promise<SectorReportsByCell> {
  const { data } = await api.get<SectorReportsByCell>("/api/sector/reports", {
    params: { month },
  });
  return data;
}

export async function fetchSectorReport(reportId: string): Promise<SectorReportDetail> {
  const { data } = await api.get<SectorReportDetail>(`/api/sector/reports/${reportId}`);
  return data;
}

export async function fetchSectorEscalations(): Promise<IssueApiRow[]> {
  const { data } = await api.get<IssueApiRow[]>("/api/sector/escalations");
  return data;
}

export async function fetchSectorCells(): Promise<SectorCellRow[]> {
  const { data } = await api.get<SectorCellRow[]>("/api/sector/cells");
  return data;
}

export async function fetchSectorProfile(): Promise<SectorProfile> {
  const { data } = await api.get<SectorProfile>("/api/sector/profile");
  return data;
}
