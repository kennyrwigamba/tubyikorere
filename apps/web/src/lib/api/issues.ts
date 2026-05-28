import { api } from "@/lib/api";
import type { IssuePreview, IssueDetail } from "@/lib/types/issue";
import type { IssueStatus } from "@/lib/constants";

export type IssueApiRow = {
  issue: {
    id: string;
    summary: string;
    category: IssuePreview["category"];
    severity: IssuePreview["severity"];
    status: IssueStatus;
    submissionChannel: IssuePreview["submissionChannel"];
    createdAt: string;
    updatedAt: string;
    requiresEscalation: boolean;
    rawText: string;
    severityReason: string;
    recommendedAction: string;
    estimatedParticipants: number;
    escalationReason: string | null;
    resolutionNotes: string | null;
    umugandaSessionId: string | null;
    languageDetected: string | null;
    submitterPhone: string | null;
    photoUrl: string | null;
  };
  village_name: string | null;
};

export function mapIssueRow(row: IssueApiRow): IssuePreview {
  return {
    id: row.issue.id,
    summary: row.issue.summary,
    category: row.issue.category,
    severity: row.issue.severity,
    status: row.issue.status,
    submissionChannel: row.issue.submissionChannel,
    villageName: row.village_name ?? "Unknown village",
    createdAt: row.issue.createdAt,
    requiresEscalation: row.issue.requiresEscalation,
  };
}

export function mapIssueDetail(row: IssueApiRow): IssueDetail {
  return {
    ...mapIssueRow(row),
    rawText: row.issue.rawText,
    severityReason: row.issue.severityReason,
    recommendedAction: row.issue.recommendedAction,
    estimatedParticipants: row.issue.estimatedParticipants,
    escalationReason: row.issue.escalationReason,
    resolutionNotes: row.issue.resolutionNotes,
    updatedAt: row.issue.updatedAt,
    umugandaSessionId: row.issue.umugandaSessionId,
    languageDetected: row.issue.languageDetected,
    submitterPhone: row.issue.submitterPhone,
    photoUrl: row.issue.photoUrl,
  };
}

export type IssueTrack = {
  reference: string;
  id: string;
  status: IssueStatus;
  status_label_en: string;
  status_label_rw: string;
  village_name: string;
  category: IssuePreview["category"];
  summary: string;
  resolution_notes: string | null;
  submitted_at: string;
  updated_at: string;
  resolved_at: string | null;
};

export async function fetchIssueTrack(ref: string): Promise<IssueTrack> {
  const { data } = await api.get<IssueTrack>(`/api/issues/track/${encodeURIComponent(ref)}`);
  return data;
}

export async function fetchIssueDetail(issueId: string): Promise<IssueDetail> {
  const { data } = await api.get<IssueApiRow>(`/api/issues/${issueId}`);
  return mapIssueDetail(data);
}

export async function updateIssueStatus(
  issueId: string,
  status: IssueStatus,
  resolutionNotes?: string,
): Promise<void> {
  await api.patch(`/api/issues/${issueId}/status`, {
    status,
    resolution_notes: resolutionNotes ?? null,
  });
}

export async function fetchCellIssues(cellId: string, limit = 100): Promise<IssuePreview[]> {
  const { data } = await api.get<IssueApiRow[]>("/api/issues", {
    params: { cell_id: cellId, limit },
  });
  return data.map(mapIssueRow);
}

export async function fetchVillageIssues(
  cellId: string,
  villageId: string,
  limit = 100,
): Promise<IssuePreview[]> {
  const { data } = await api.get<IssueApiRow[]>("/api/issues", {
    params: { cell_id: cellId, village_id: villageId, limit },
  });
  return data.map(mapIssueRow);
}

export type IssueListTab = "all" | "open" | "assigned" | "resolved" | "escalated";

export const ISSUE_LIST_TABS: { value: IssueListTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "assigned", label: "Assigned" },
  { value: "resolved", label: "Resolved" },
  { value: "escalated", label: "Escalated" },
];

export function issueMatchesTab(issue: IssuePreview, tab: IssueListTab): boolean {
  switch (tab) {
    case "all":
      return true;
    case "open":
      return issue.status === "open";
    case "assigned":
      return issue.status === "assigned" || issue.status === "in_progress";
    case "resolved":
      return issue.status === "resolved" || issue.status === "closed";
    case "escalated":
      return issue.status === "escalated";
  }
}

export function countIssuesByTab(issues: IssuePreview[]): Record<IssueListTab, number> {
  return ISSUE_LIST_TABS.reduce(
    (counts, tab) => ({
      ...counts,
      [tab.value]: issues.filter((issue) => issueMatchesTab(issue, tab.value)).length,
    }),
    {} as Record<IssueListTab, number>,
  );
}
