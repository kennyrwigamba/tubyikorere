import { ChevronRightIcon, ClipboardListIcon, UsersIcon } from "lucide-react";

import { StatusBadge } from "@/components/atoms/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import type { UmugandaSession } from "@/lib/api/umuganda";
import { cn, formatDate } from "@/lib/utils";

type SessionCardProps = {
  session: UmugandaSession;
  onClick?: () => void;
  className?: string;
};

export function SessionCard({ session, onClick, className }: SessionCardProps) {
  const interactive = Boolean(onClick);

  return (
    <Card
      className={cn(
        "overflow-hidden py-0 shadow-none",
        interactive && "cursor-pointer transition-colors hover:bg-muted/40 active:scale-[0.99]",
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
      <CardContent className="flex items-center gap-4 py-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-semibold">{formatDate(session.sessionDate, "EEEE, d MMM yyyy")}</p>
            <StatusBadge status={session.status} kind="session" size="sm" />
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <UsersIcon className="size-3.5 shrink-0" aria-hidden />
              {session.status === "completed" && session.actualParticipants != null
                ? `${session.actualParticipants} attended`
                : `${session.expectedParticipants} expected`}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ClipboardListIcon className="size-3.5 shrink-0" aria-hidden />
              {session.assignmentCount} issues assigned
            </span>
          </div>
        </div>

        {interactive ? (
          <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        ) : null}
      </CardContent>
    </Card>
  );
}
