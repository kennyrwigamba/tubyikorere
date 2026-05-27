import { cn, getSeverityConfig } from "@/lib/utils";

type SeverityBadgeProps = {
  severity: number;
  size?: "sm" | "default" | "lg";
};

export function SeverityBadge({ severity, size = "default" }: SeverityBadgeProps) {
  const cfg = getSeverityConfig(severity);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--radius-sm)] border px-2.5 py-1 font-medium",
        size === "sm" && "text-xs",
        size === "default" && "text-sm",
        size === "lg" && "px-3 py-1.5 text-base",
        cfg.colorClass,
        cfg.bgClass,
        cfg.borderClass
      )}
    >
      <span className={cn("size-1.5 rounded-full", cfg.dotClass)} />
      <span>
        {severity} {cfg.label}
      </span>
    </span>
  );
}
