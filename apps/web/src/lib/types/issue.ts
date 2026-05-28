import type {
  IssueCategory,
  IssueStatus,
  SeverityLevel,
  SubmissionChannel,
} from "@/lib/constants";

/** Minimal issue shape for list/card previews — matches API list responses. */
export type IssuePreview = {
  id: string;
  summary: string;
  category: IssueCategory;
  severity: SeverityLevel;
  status: IssueStatus;
  submissionChannel: SubmissionChannel;
  villageName: string;
  createdAt: string | Date;
  requiresEscalation?: boolean;
};

/** Full issue detail — matches API GET /issues/:id response. */
export type IssueDetail = IssuePreview & {
  rawText: string;
  severityReason: string;
  recommendedAction: string;
  estimatedParticipants: number;
  escalationReason: string | null;
  resolutionNotes: string | null;
  updatedAt: string;
  umugandaSessionId: string | null;
  languageDetected: string | null;
  submitterPhone: string | null;
};
