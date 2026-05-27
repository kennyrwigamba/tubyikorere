import { clsx, type ClassValue } from "clsx";
import { format, formatDistanceToNowStrict } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getSeverityConfig(severity: number) {
  const map: Record<
    number,
    {
      label: string;
      colorClass: string;
      bgClass: string;
      borderClass: string;
      dotClass: string;
    }
  > = {
    5: {
      label: "Critical",
      colorClass: "text-[var(--severity-5)]",
      bgClass: "bg-[var(--severity-5-bg)]",
      borderClass: "border-[var(--severity-5-border)]",
      dotClass: "bg-[var(--severity-5)]",
    },
    4: {
      label: "High",
      colorClass: "text-[var(--severity-4)]",
      bgClass: "bg-[var(--severity-4-bg)]",
      borderClass: "border-[var(--severity-4-border)]",
      dotClass: "bg-[var(--severity-4)]",
    },
    3: {
      label: "Medium",
      colorClass: "text-[var(--severity-3)]",
      bgClass: "bg-[var(--severity-3-bg)]",
      borderClass: "border-[var(--severity-3-border)]",
      dotClass: "bg-[var(--severity-3)]",
    },
    2: {
      label: "Low",
      colorClass: "text-[var(--severity-2)]",
      bgClass: "bg-[var(--severity-2-bg)]",
      borderClass: "border-[var(--severity-2-border)]",
      dotClass: "bg-[var(--severity-2)]",
    },
    1: {
      label: "Minimal",
      colorClass: "text-[var(--severity-1)]",
      bgClass: "bg-[var(--severity-1-bg)]",
      borderClass: "border-[var(--severity-1-border)]",
      dotClass: "bg-[var(--severity-1)]",
    },
  };
  return map[severity] ?? map[1];
}

export function getStatusConfig(status: string) {
  const base = "border";
  const map: Record<string, { label: string; className: string }> = {
    open: { label: "Open", className: `${base} border-blue-200 bg-blue-50 text-blue-700` },
    assigned: {
      label: "Assigned",
      className: `${base} border-green-200 bg-green-50 text-green-700`,
    },
    in_progress: {
      label: "In Progress",
      className: `${base} border-amber-200 bg-amber-50 text-amber-700`,
    },
    resolved: {
      label: "Resolved",
      className: "border border-green-700 bg-green-700 text-white",
    },
    escalated: {
      label: "Escalated",
      className: `${base} border-orange-200 bg-orange-50 text-orange-700`,
    },
    closed: { label: "Closed", className: `${base} border-zinc-300 bg-zinc-100 text-zinc-700` },
    planned: { label: "Planned", className: `${base} border-blue-200 bg-blue-50 text-blue-700` },
    active: { label: "Active", className: `${base} border-amber-200 bg-amber-50 text-amber-700` },
    completed: {
      label: "Completed",
      className: "border border-green-700 bg-green-700 text-white",
    },
    draft: { label: "Draft", className: `${base} border-zinc-300 bg-zinc-100 text-zinc-700` },
    approved: {
      label: "Approved",
      className: `${base} border-green-200 bg-green-50 text-green-700`,
    },
    submitted: {
      label: "Submitted",
      className: `${base} border-blue-200 bg-blue-50 text-blue-700`,
    },
  };
  return map[status] ?? { label: status, className: `${base} border-zinc-300 bg-zinc-100 text-zinc-700` };
}

export function formatTimeAgo(date: string | Date) {
  return formatDistanceToNowStrict(new Date(date), { addSuffix: true });
}

export function formatDate(date: string | Date) {
  return format(new Date(date), "EEEE, dd MMMM yyyy");
}
