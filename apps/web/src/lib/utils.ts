import { clsx, type ClassValue } from "clsx";
import { format, formatDistanceToNowStrict } from "date-fns";
import { twMerge } from "tailwind-merge";

export { getCategoryConfig } from "@/lib/config/categories";
export { getSeverityConfig, getSeverityStripClass } from "@/lib/config/severity";
export {
  getIssueStatusConfig,
  getReportStatusConfig,
  getSessionStatusConfig,
  getStatusConfig,
} from "@/lib/config/status";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeAgo(date: string | Date): string {
  return formatDistanceToNowStrict(new Date(date), { addSuffix: true });
}

export function formatDate(date: string | Date, pattern = "d MMM yyyy"): string {
  return format(new Date(date), pattern);
}

export function formatPercent(value: number, decimals = 1): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}
