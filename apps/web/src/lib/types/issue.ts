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
