import type { IssueCategory } from "@/lib/constants";

export type CategoryConfig = {
  label: string;
  className: string;
};

const CATEGORY_CONFIG: Record<IssueCategory, CategoryConfig> = {
  infrastructure: {
    label: "Infrastructure",
    className: "bg-muted text-muted-foreground border-border",
  },
  water: {
    label: "Water",
    className: "bg-sky-500/10 text-sky-700 border-sky-200 dark:text-sky-300 dark:border-sky-800",
  },
  health: {
    label: "Health",
    className:
      "bg-[var(--severity-4-bg)] text-[var(--severity-4)] border-[var(--severity-4-border)]",
  },
  education: {
    label: "Education",
    className:
      "bg-[var(--color-brand-green-muted)] text-[var(--color-brand-green)] border-[var(--color-brand-green)]/20",
  },
  environment: {
    label: "Environment",
    className:
      "bg-[var(--severity-2-bg)] text-[var(--severity-2)] border-[var(--severity-2-border)]",
  },
  safety: {
    label: "Safety",
    className:
      "bg-[var(--severity-5-bg)] text-[var(--severity-5)] border-[var(--severity-5-border)]",
  },
  other: {
    label: "Other",
    className: "bg-muted text-muted-foreground border-border",
  },
};

export function getCategoryConfig(category: IssueCategory): CategoryConfig {
  return CATEGORY_CONFIG[category];
}
