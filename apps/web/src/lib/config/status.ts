import type { IssueStatus, ReportStatus, SessionStatus } from "@/lib/constants";

type StatusKind = "issue" | "session" | "report";

export type StatusConfig = {
  label: string;
  className: string;
};

const ISSUE_STATUS: Record<IssueStatus, StatusConfig> = {
  open: {
    label: "Open",
    className: "bg-sky-500/10 text-sky-700 border-sky-200 dark:text-sky-300 dark:border-sky-800",
  },
  assigned: {
    label: "Assigned",
    className:
      "bg-[var(--color-brand-green-muted)] text-[var(--color-brand-green)] border-[var(--color-brand-green)]/20",
  },
  in_progress: {
    label: "In progress",
    className:
      "bg-[var(--color-brand-amber-muted)] text-[var(--color-brand-amber)] border-[var(--color-brand-amber)]/30",
  },
  resolved: {
    label: "Resolved",
    className: "bg-primary text-primary-foreground border-primary",
  },
  escalated: {
    label: "Escalated",
    className:
      "bg-[var(--severity-4-bg)] text-[var(--severity-4)] border-[var(--severity-4-border)]",
  },
  closed: {
    label: "Closed",
    className: "bg-muted text-muted-foreground border-border",
  },
};

const SESSION_STATUS: Record<SessionStatus, StatusConfig> = {
  planned: {
    label: "Planned",
    className: "bg-muted text-muted-foreground border-border",
  },
  active: {
    label: "Active",
    className:
      "bg-[var(--color-brand-green-muted)] text-[var(--color-brand-green)] border-[var(--color-brand-green)]/20",
  },
  completed: {
    label: "Completed",
    className: "bg-primary text-primary-foreground border-primary",
  },
};

const REPORT_STATUS: Record<ReportStatus, StatusConfig> = {
  draft: {
    label: "Draft",
    className: "bg-muted text-muted-foreground border-border",
  },
  approved: {
    label: "Approved",
    className:
      "bg-[var(--color-brand-green-muted)] text-[var(--color-brand-green)] border-[var(--color-brand-green)]/20",
  },
  submitted: {
    label: "Submitted",
    className: "bg-primary text-primary-foreground border-primary",
  },
};

export function getIssueStatusConfig(status: IssueStatus): StatusConfig {
  return ISSUE_STATUS[status];
}

export function getSessionStatusConfig(status: SessionStatus): StatusConfig {
  return SESSION_STATUS[status];
}

export function getReportStatusConfig(status: ReportStatus): StatusConfig {
  return REPORT_STATUS[status];
}

export function getStatusConfig(
  status: IssueStatus | SessionStatus | ReportStatus,
  kind: StatusKind = "issue",
): StatusConfig {
  if (kind === "session") {
    return getSessionStatusConfig(status as SessionStatus);
  }
  if (kind === "report") {
    return getReportStatusConfig(status as ReportStatus);
  }
  return getIssueStatusConfig(status as IssueStatus);
}
