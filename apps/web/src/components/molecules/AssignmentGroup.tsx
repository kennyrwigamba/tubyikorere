import { ClockIcon, WrenchIcon } from "lucide-react";

import { SeverityBadge } from "@/components/atoms/SeverityBadge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import type { SeverityLevel } from "@/lib/constants";
import { cn } from "@/lib/utils";

type AssignmentGroupProps = {
  letter: string;
  participantCount: number;
  issueSummary: string;
  severity: SeverityLevel;
  taskDescription: string;
  estimatedHours: number;
  materialsNeeded: string;
  status?: "assigned" | "partial";
  className?: string;
};

export function AssignmentGroup({
  letter,
  participantCount,
  issueSummary,
  severity,
  taskDescription,
  estimatedHours,
  materialsNeeded,
  status = "assigned",
  className,
}: AssignmentGroupProps) {
  const borderColor =
    status === "partial"
      ? "border-l-[var(--color-brand-amber)]"
      : "border-l-[var(--color-brand-green)]";

  return (
    <Card className={cn("border-l-2", borderColor, className)}>
      <CardHeader className="flex flex-row items-center gap-4 border-b pb-4">
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-extrabold text-primary-foreground"
          aria-hidden
        >
          {letter}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold">Group {letter}</h3>
          <Badge variant="secondary" className="mt-1">
            {participantCount} participants
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={severity} size="sm" />
          <p className="text-sm font-medium">{issueSummary}</p>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          {taskDescription}
        </p>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="gap-1.5 font-normal">
            <ClockIcon className="size-3.5" aria-hidden />
            {estimatedHours} hours
          </Badge>
          <Badge variant="outline" className="gap-1.5 font-normal">
            <WrenchIcon className="size-3.5" aria-hidden />
            {materialsNeeded}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
