import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn, formatPercent } from "@/lib/utils";

type TrendDirection = "up" | "down" | "neutral";

type TrendBadgeProps = {
  value: number;
  direction?: TrendDirection;
  className?: string;
};

function resolveDirection(value: number, direction?: TrendDirection): TrendDirection {
  if (direction) return direction;
  if (value > 0) return "up";
  if (value < 0) return "down";
  return "neutral";
}

export function TrendBadge({ value, direction, className }: TrendBadgeProps) {
  const resolved = resolveDirection(value, direction);
  const Icon = resolved === "down" ? TrendingDownIcon : TrendingUpIcon;

  return (
    <Badge variant="outline" className={cn("tabular-nums", className)}>
      {resolved !== "neutral" ? <Icon aria-hidden /> : null}
      {formatPercent(value)}
    </Badge>
  );
}
