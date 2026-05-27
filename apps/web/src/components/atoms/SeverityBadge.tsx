import { cva, type VariantProps } from "class-variance-authority";

import { getSeverityConfig } from "@/lib/config/severity";
import type { SeverityLevel } from "@/lib/constants";
import { cn } from "@/lib/utils";

const severityBadgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-[var(--radius-sm)] border font-medium whitespace-nowrap",
  {
    variants: {
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-1 text-xs",
        lg: "px-3 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

const dotSizes = {
  sm: "size-1.5",
  md: "size-1.5",
  lg: "size-2",
} as const;

type SeverityBadgeProps = VariantProps<typeof severityBadgeVariants> & {
  severity: SeverityLevel;
  showLabel?: boolean;
  className?: string;
};

export function SeverityBadge({
  severity,
  size = "md",
  showLabel = true,
  className,
}: SeverityBadgeProps) {
  const config = getSeverityConfig(severity);

  return (
    <span
      className={cn(severityBadgeVariants({ size }), config.badgeClass, className)}
      aria-label={`Severity ${severity}, ${config.label}`}
    >
      <span
        className={cn("shrink-0 rounded-full", dotSizes[size ?? "md"], config.dotClass)}
        aria-hidden
      />
      <span>{severity}</span>
      {showLabel ? <span>{config.label}</span> : null}
    </span>
  );
}
