import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangleIcon, CalendarDaysIcon, ClipboardCheckIcon } from "lucide-react";

import { LoadingSpinner } from "@/components/atoms/LoadingSpinner";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { AssignmentGroup } from "@/components/molecules/AssignmentGroup";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchCoordinatorHome } from "@/lib/api/coordinator";
import { mapIssueRow } from "@/lib/api/issues";
import { groupLetter } from "@/lib/api/umuganda";
import type { SeverityLevel } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { useAppStore } from "@/store";

export default function CoordinatorHomeRoute() {
  const { userId, userName, entityName } = useAppStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ["coordinator-home", userId],
    queryFn: () => fetchCoordinatorHome(userId),
    enabled: Boolean(userId),
  });

  if (isLoading) {
    return <LoadingSpinner label="Loading your umuganda plan..." fullPage />;
  }

  const session = data?.next_session;
  const assignment = data?.assignment;
  const villageIssues = (data?.village_issues ?? []).map(mapIssueRow);

  return (
    <>
      <PageHeader
        title={entityName || "My village"}
        description={`${userName || "Coordinator"} · next umuganda`}
        actions={
          session ? (
            <Button asChild size="sm">
              <Link to="/coordinator/attendance">
                <ClipboardCheckIcon className="size-4" aria-hidden />
                Record attendance
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="flex flex-col gap-6 px-4 pt-5 pb-6 lg:px-6 lg:pt-6">
        {error ? (
          <Alert variant="destructive">
            <AlertTriangleIcon className="size-4" />
            <AlertTitle>Failed to load</AlertTitle>
            <AlertDescription>{(error as Error).message}</AlertDescription>
          </Alert>
        ) : null}

        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 py-4">
            <CalendarDaysIcon className="size-5 text-muted-foreground" aria-hidden />
            {session ? (
              <div>
                <p className="text-lg font-semibold">
                  {formatDate(session.sessionDate, "EEEE, d MMMM yyyy")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {session.status === "active"
                    ? "Plan confirmed — ready for umuganda day"
                    : "Upcoming session — waiting for plan confirmation"}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No upcoming umuganda session scheduled yet.
              </p>
            )}
            {session ? <StatusBadge status={session.status} kind="session" size="sm" /> : null}
          </CardContent>
        </Card>

        {session && assignment ? (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Your assignment</h2>
            <AssignmentGroup
              letter={groupLetter(
                assignment.assignment.groupName,
                assignment.assignment.displayOrder,
              )}
              participantCount={assignment.assignment.assignedParticipants}
              issueSummary={assignment.issue_summary}
              severity={assignment.issue_severity as SeverityLevel}
              taskDescription={assignment.assignment.taskDescription}
              estimatedHours={Number(assignment.assignment.estimatedHours)}
              materialsNeeded={assignment.assignment.materialsNeeded ?? "None listed"}
            />
          </section>
        ) : session ? (
          <Alert>
            <AlertTriangleIcon className="size-4" />
            <AlertTitle>No assignment for {entityName} yet</AlertTitle>
            <AlertDescription>
              The cell executive has not generated the work plan, or your village has no issue
              assigned this session. Check back before Saturday.
            </AlertDescription>
          </Alert>
        ) : null}

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Issues from your village</h2>
          {villageIssues.length > 0 ? (
            <ul className="divide-y divide-border rounded-lg border">
              {villageIssues.map((issue) => (
                <li key={issue.id} className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm">
                  <StatusBadge status={issue.status} kind="issue" size="sm" />
                  <span className="min-w-0 flex-1 font-medium">{issue.summary}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(issue.createdAt, "d MMM yyyy")}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No issues submitted from your village yet.
            </p>
          )}
        </section>

        <Button asChild className="h-11 w-full sm:hidden">
          <Link to="/coordinator/attendance">
            <ClipboardCheckIcon className="size-4" aria-hidden />
            Record attendance
          </Link>
        </Button>
      </div>
    </>
  );
}
