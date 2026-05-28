import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  ClipboardCheckIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react";
import { toast } from "sonner";

import { LoadingSpinner } from "@/components/atoms/LoadingSpinner";
import { SeverityBadge } from "@/components/atoms/SeverityBadge";
import { AssignmentGroup } from "@/components/molecules/AssignmentGroup";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getApiErrorMessage } from "@/lib/api/errors";
import { fetchCellIssues } from "@/lib/api/issues";
import {
  confirmSessionPlan,
  fetchSessionDetail,
  generateSessionPlan,
  groupLetter,
  type GeneratePlanResult,
} from "@/lib/api/umuganda";
import type { SeverityLevel } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { useAppStore } from "@/store";

export default function CellExecutiveUmugandaPlanRoute() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { entityId } = useAppStore();
  const [planMeta, setPlanMeta] = useState<Pick<
    GeneratePlanResult,
    "unassigned_issue_ids" | "unassigned_reason"
  > | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);

  const {
    data: sessionDetail,
    isLoading: sessionLoading,
    error: sessionError,
  } = useQuery({
    queryKey: ["cell-exec-session", id],
    queryFn: () => fetchSessionDetail(id!),
    enabled: Boolean(id),
  });

  const { data: cellIssues = [] } = useQuery({
    queryKey: ["cell-exec-issues", entityId],
    queryFn: () => fetchCellIssues(entityId),
    enabled: Boolean(entityId),
  });

  const openIssues = useMemo(
    () =>
      [...cellIssues]
        .filter((issue) => issue.status === "open")
        .sort((a, b) => b.severity - a.severity),
    [cellIssues],
  );

  const planMutation = useMutation({
    mutationFn: () => generateSessionPlan(id!),
    onSuccess: (result) => {
      setPlanMeta({
        unassigned_issue_ids: result.unassigned_issue_ids,
        unassigned_reason: result.unassigned_reason,
      });
      setPlanError(null);
      void queryClient.invalidateQueries({ queryKey: ["cell-exec-session", id] });
      void queryClient.invalidateQueries({ queryKey: ["cell-exec-sessions", entityId] });
      void queryClient.invalidateQueries({ queryKey: ["cell-exec-issues", entityId] });
    },
    onError: (error: unknown) => {
      setPlanError(getApiErrorMessage(error, "Unable to generate work plan. Please try again."));
    },
  });

  const confirmMutation = useMutation({
    mutationFn: () => confirmSessionPlan(id!),
    onSuccess: () => {
      toast.success("Work plan confirmed", {
        description: "You can now record attendance on umuganda day.",
      });
      void queryClient.invalidateQueries({ queryKey: ["cell-exec-session", id] });
      void queryClient.invalidateQueries({ queryKey: ["cell-exec-sessions", entityId] });
      navigate(`/cell-executive/umuganda/${id}/attendance`);
    },
    onError: (error: unknown) => {
      toast.error("Could not confirm plan", {
        description: getApiErrorMessage(error),
      });
    },
  });

  const session = sessionDetail?.session;
  const assignments = useMemo(
    () => sessionDetail?.assignments ?? [],
    [sessionDetail?.assignments],
  );
  const hasPlan = assignments.length > 0;
  const isConfirmed = session?.status === "active" || session?.status === "completed";

  const assignedIssueIds = useMemo(
    () => new Set(assignments.map((row) => row.assignment.issueId)),
    [assignments],
  );

  const unassignedIssues = useMemo(() => {
    if (planMeta?.unassigned_issue_ids.length) {
      const ids = new Set(planMeta.unassigned_issue_ids);
      return cellIssues.filter((issue) => ids.has(issue.id));
    }
    if (!hasPlan) return [];
    return cellIssues.filter(
      (issue) => issue.status === "open" && !assignedIssueIds.has(issue.id),
    );
  }, [cellIssues, planMeta, hasPlan, assignedIssueIds]);

  if (sessionLoading) {
    return <LoadingSpinner label="Loading session..." fullPage />;
  }

  if (sessionError || !session) {
    return (
      <div className="space-y-4 px-4 py-6 lg:px-6">
        <Alert variant="destructive">
          <AlertTriangleIcon className="size-4" />
          <AlertTitle>Session not found</AlertTitle>
          <AlertDescription>
            {(sessionError as Error)?.message || "This session may have been removed."}
          </AlertDescription>
        </Alert>
        <Button variant="outline" asChild>
          <Link to="/cell-executive/umuganda">Back to sessions</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Plan umuganda"
        description={`${formatDate(session.sessionDate, "EEEE, d MMMM yyyy")} · ${session.expectedParticipants} expected participants`}
        actions={
          hasPlan ? (
            isConfirmed ? (
              <Button size="sm" asChild>
                <Link to={`/cell-executive/umuganda/${id}/attendance`}>
                  <ClipboardCheckIcon className="size-4" aria-hidden />
                  Record attendance
                </Link>
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={confirmMutation.isPending}
                onClick={() => confirmMutation.mutate()}
              >
                {confirmMutation.isPending ? "Confirming…" : "Confirm plan"}
              </Button>
            )
          ) : null
        }
      />

      <div className="flex flex-col gap-6 px-4 pt-5 pb-6 lg:px-6 lg:pt-6">
        <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
          <Link to="/cell-executive/umuganda">
            <ArrowLeftIcon className="size-4" />
            Back to sessions
          </Link>
        </Button>

        <Card>
          <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 py-4 text-sm">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <UsersIcon className="size-4 text-muted-foreground" aria-hidden />
              {session.expectedParticipants} participants expected
            </span>
            <span className="text-muted-foreground">
              {hasPlan
                ? `${assignments.length} work groups assigned`
                : `${openIssues.length} open issues available for planning`}
            </span>
          </CardContent>
        </Card>

        {planMutation.isPending ? (
          <LoadingSpinner
            label="Claude is planning your session..."
            fullPage
            className="min-h-[40vh]"
          />
        ) : null}

        {!hasPlan && !planMutation.isPending ? (
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Open issues</h2>
              <p className="text-sm text-muted-foreground">
                Sorted by severity — Claude uses these to build work groups.
              </p>
            </div>

            {openIssues.length > 0 ? (
              <div className="flex flex-col gap-2">
                {openIssues.map((issue) => (
                  <Card key={issue.id} className="py-0 shadow-none">
                    <CardContent className="flex flex-wrap items-center gap-3 py-3">
                      <SeverityBadge severity={issue.severity} size="sm" />
                      <p className="min-w-0 flex-1 text-sm font-medium">{issue.summary}</p>
                      <span className="text-xs text-muted-foreground">{issue.villageName}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Alert>
                <AlertTriangleIcon className="size-4" />
                <AlertTitle>No open issues</AlertTitle>
                <AlertDescription>
                  There are no open issues to assign. Citizens can submit via the public form.
                </AlertDescription>
              </Alert>
            )}

            {planError ? (
              <Alert variant="destructive">
                <AlertTriangleIcon className="size-4" />
                <AlertTitle>Planning failed</AlertTitle>
                <AlertDescription>{planError}</AlertDescription>
              </Alert>
            ) : null}

            <Button
              size="lg"
              className="h-11 w-full sm:w-auto"
              disabled={openIssues.length === 0 || planMutation.isPending}
              onClick={() => planMutation.mutate()}
            >
              <SparklesIcon className="size-4" />
              Generate work plan
            </Button>
          </section>
        ) : null}

        {hasPlan && !planMutation.isPending ? (
          <section className="space-y-6">
            {session.planningNotes ? (
              <p className="text-sm leading-relaxed text-muted-foreground">{session.planningNotes}</p>
            ) : null}

            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Work groups</h2>
              <div className="flex flex-col gap-4">
                {assignments.map((row) => (
                  <AssignmentGroup
                    key={row.assignment.id}
                    letter={groupLetter(row.assignment.groupName, row.assignment.displayOrder)}
                    participantCount={row.assignment.assignedParticipants}
                    issueSummary={row.issue_summary}
                    severity={row.issue_severity as SeverityLevel}
                    taskDescription={row.assignment.taskDescription}
                    estimatedHours={Number(row.assignment.estimatedHours)}
                    materialsNeeded={row.assignment.materialsNeeded ?? "None listed"}
                  />
                ))}
              </div>
            </div>

            {unassignedIssues.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Unassigned issues</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {planMeta?.unassigned_reason ? (
                    <p className="text-sm text-muted-foreground">{planMeta.unassigned_reason}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      These issues remain open — not enough participants or lower priority for this
                      session.
                    </p>
                  )}
                  <ul className="space-y-2">
                    {unassignedIssues.map((issue) => (
                      <li key={issue.id} className="flex items-center gap-2 text-sm">
                        <SeverityBadge severity={issue.severity} size="sm" showLabel={false} />
                        <span>{issue.summary}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : null}
          </section>
        ) : null}
      </div>
    </>
  );
}
