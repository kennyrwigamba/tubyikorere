import type { ReactNode } from "react";
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn, formatPercent } from "@/lib/utils";

export type StatCardProps = {
  label: string;
  value: string | number;
  /** Percent change shown in the top-right badge. Omit to hide. */
  trend?: number;
  /** Primary footer line — e.g. "2 new since last week" */
  trendLabel?: string;
  /** Secondary footer line — muted helper text */
  footer?: ReactNode;
  className?: string;
};

function TrendIcon({ trend, className }: { trend: number; className?: string }) {
  const Icon = trend < 0 ? TrendingDownIcon : TrendingUpIcon;
  return <Icon aria-hidden className={className} />;
}

/** Single metric card — extracted from shadcn dashboard-01 SectionCards. */
export function StatCard({
  label,
  value,
  trend,
  trendLabel,
  footer,
  className,
}: StatCardProps) {
  const showFooter = Boolean(trendLabel || footer);

  return (
    <Card className={cn("@container/card", className)}>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {value}
        </CardTitle>
        {trend !== undefined ? (
          <CardAction>
            <Badge variant="outline" className="tabular-nums">
              <TrendIcon trend={trend} />
              {formatPercent(trend)}
            </Badge>
          </CardAction>
        ) : null}
      </CardHeader>
      {showFooter ? (
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          {trendLabel ? (
            <div className="line-clamp-1 flex gap-2 font-medium">
              {trendLabel}
              {trend !== undefined ? <TrendIcon trend={trend} className="size-4" /> : null}
            </div>
          ) : null}
          {footer ? (
            <div className="text-muted-foreground">{footer}</div>
          ) : null}
        </CardFooter>
      ) : null}
    </Card>
  );
}

type StatCardGridProps = {
  children: ReactNode;
  className?: string;
};

/** Responsive stat grid — uses container queries so layout respects sidebar width. */
export function StatCardGrid({ children, className }: StatCardGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card",
        className,
      )}
    >
      {children}
    </div>
  );
}
