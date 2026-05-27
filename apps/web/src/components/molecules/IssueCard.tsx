import { ChevronRightIcon, TriangleAlertIcon } from "lucide-react";

import { CategoryChip } from "@/components/atoms/CategoryChip";
import { ChannelIcon } from "@/components/atoms/ChannelIcon";
import { SeverityBadge } from "@/components/atoms/SeverityBadge";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { getSeverityStripClass } from "@/lib/config/severity";
import type { IssuePreview } from "@/lib/types/issue";
import { cn, formatTimeAgo } from "@/lib/utils";

type IssueCardProps = {
  issue: IssuePreview;
  onClick?: () => void;
  className?: string;
};

export function IssueCard({ issue, onClick, className }: IssueCardProps) {
  const interactive = Boolean(onClick);

  return (
    <Card
      className={cn(
        "flex flex-row gap-0 overflow-hidden py-0 shadow-none",
        interactive &&
          "cursor-pointer transition-colors hover:bg-muted/40 active:scale-[0.99]",
        className,
      )}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      <div
        className={cn("w-1 shrink-0", getSeverityStripClass(issue.severity))}
        aria-hidden
      />

      <CardContent className="min-w-0 flex-1 py-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <SeverityBadge severity={issue.severity} size="sm" showLabel={false} />
          <CategoryChip category={issue.category} />
          <StatusBadge status={issue.status} size="sm" />
        </div>

        <p className="line-clamp-2 text-base font-semibold leading-snug">
          {issue.summary}
        </p>

        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="truncate">{issue.villageName}</span>
          <span aria-hidden>·</span>
          <ChannelIcon channel={issue.submissionChannel} />
          <span aria-hidden>·</span>
          <time dateTime={new Date(issue.createdAt).toISOString()}>
            {formatTimeAgo(issue.createdAt)}
          </time>
        </div>

        {issue.requiresEscalation ? (
          <div className="mt-3 flex items-center gap-1.5 border-t pt-3 text-xs text-[var(--color-brand-amber)]">
            <TriangleAlertIcon className="size-3.5 shrink-0" aria-hidden />
            Flagged for sector escalation
          </div>
        ) : null}
      </CardContent>

      {interactive ? (
        <div className="flex shrink-0 items-center pr-3 text-muted-foreground">
          <ChevronRightIcon className="size-4" aria-hidden />
        </div>
      ) : null}
    </Card>
  );
}

type IssueCardListProps = {
  issues: IssuePreview[];
  onIssueClick?: (issue: IssuePreview) => void;
  className?: string;
};

export function IssueCardList({ issues, onIssueClick, className }: IssueCardListProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {issues.map((issue) => (
        <IssueCard
          key={issue.id}
          issue={issue}
          onClick={onIssueClick ? () => onIssueClick(issue) : undefined}
        />
      ))}
    </div>
  );
}
