import { cva, type VariantProps } from "class-variance-authority";

import { getStatusConfig } from "@/lib/config/status";
import type { IssueStatus, ReportStatus, SessionStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center rounded-[var(--radius-sm)] border px-2.5 py-1 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-1 text-xs",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

type StatusBadgeProps = VariantProps<typeof statusBadgeVariants> & {
  status: IssueStatus | SessionStatus | ReportStatus;
  kind?: "issue" | "session" | "report";
  className?: string;
};

export function StatusBadge({
  status,
  kind = "issue",
  size = "md",
  className,
}: StatusBadgeProps) {
  const config = getStatusConfig(status, kind);

  return (
    <span
      className={cn(statusBadgeVariants({ size }), config.className, className)}
      aria-label={`Status: ${config.label}`}
    >
      {config.label}
    </span>
  );
}
