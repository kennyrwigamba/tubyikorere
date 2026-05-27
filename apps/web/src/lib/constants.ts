export const ROLES = [
  "cell_executive",
  "village_coordinator",
  "sector_official",
  "admin",
] as const;

export const ISSUE_STATUSES = [
  "open",
  "assigned",
  "in_progress",
  "resolved",
  "escalated",
  "closed",
] as const;

export const ISSUE_CATEGORIES = [
  "infrastructure",
  "water",
  "health",
  "education",
  "environment",
  "safety",
  "other",
] as const;

export const SEVERITY_LEVELS = [1, 2, 3, 4, 5] as const;

export const SUBMISSION_CHANNELS = ["web", "whatsapp"] as const;

export const SESSION_STATUSES = ["planned", "active", "completed"] as const;

export const REPORT_STATUSES = ["draft", "approved", "submitted"] as const;

export type Role = (typeof ROLES)[number];
export type IssueStatus = (typeof ISSUE_STATUSES)[number];
export type IssueCategory = (typeof ISSUE_CATEGORIES)[number];
export type SubmissionChannel = (typeof SUBMISSION_CHANNELS)[number];
export type SessionStatus = (typeof SESSION_STATUSES)[number];
export type ReportStatus = (typeof REPORT_STATUSES)[number];
export type SeverityLevel = (typeof SEVERITY_LEVELS)[number];
