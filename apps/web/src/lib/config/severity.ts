import type { SeverityLevel } from "@/lib/constants";

export type SeverityConfig = {
  level: SeverityLevel;
  label: string;
  dotClass: string;
  badgeClass: string;
};

const SEVERITY_CONFIG: Record<SeverityLevel, Omit<SeverityConfig, "level">> = {
  5: {
    label: "Critical",
    dotClass: "bg-[var(--severity-5)]",
    badgeClass:
      "bg-[var(--severity-5-bg)] text-[var(--severity-5)] border-[var(--severity-5-border)]",
  },
  4: {
    label: "High",
    dotClass: "bg-[var(--severity-4)]",
    badgeClass:
      "bg-[var(--severity-4-bg)] text-[var(--severity-4)] border-[var(--severity-4-border)]",
  },
  3: {
    label: "Medium",
    dotClass: "bg-[var(--severity-3)]",
    badgeClass:
      "bg-[var(--severity-3-bg)] text-[var(--severity-3)] border-[var(--severity-3-border)]",
  },
  2: {
    label: "Low",
    dotClass: "bg-[var(--severity-2)]",
    badgeClass:
      "bg-[var(--severity-2-bg)] text-[var(--severity-2)] border-[var(--severity-2-border)]",
  },
  1: {
    label: "Minimal",
    dotClass: "bg-[var(--severity-1)]",
    badgeClass:
      "bg-[var(--severity-1-bg)] text-[var(--severity-1)] border-[var(--severity-1-border)]",
  },
};

export function getSeverityConfig(severity: SeverityLevel): SeverityConfig {
  const config = SEVERITY_CONFIG[severity];
  return { level: severity, ...config };
}

export function getSeverityStripClass(severity: SeverityLevel): string {
  const map: Record<SeverityLevel, string> = {
    5: "bg-[var(--severity-5)]",
    4: "bg-[var(--severity-4)]",
    3: "bg-[var(--severity-3)]",
    2: "bg-[var(--severity-2)]",
    1: "bg-[var(--severity-1)]",
  };
  return map[severity];
}
