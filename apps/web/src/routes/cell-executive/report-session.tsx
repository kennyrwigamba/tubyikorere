import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  FileTextIcon,
  SparklesIcon,
} from "lucide-react";
import { toast } from "sonner";

import { LoadingSpinner } from "@/components/atoms/LoadingSpinner";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { PageHeader } from "@/components/molecules/PageHeader";
import { ReportDocument } from "@/components/molecules/ReportDocument";
import { StatCard, StatCardGrid } from "@/components/molecules/StatCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchSessionAttendance, fetchSessionWorkCompletions } from "@/lib/api/attendance";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  fetchReportBySession,
  generateSectorReport,
  submitSectorReport,
} from "@/lib/api/reports";
import { fetchSessionDetail } from "@/lib/api/umuganda";
import { formatDate } from "@/lib/utils";

export default function CellExecutiveReportSessionRoute() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const queryClient = useQueryClient();

  const {
    data: sessionDetail,
    isLoading: sessionLoading,
    error: sessionError,
  } = useQuery({
    queryKey: ["cell-exec-session", sessionId],
    queryFn: () => fetchSessionDetail(sessionId!),
    enabled: Boolean(sessionId),
  });

  const { data: attendanceRows = [] } = useQuery({
    queryKey: ["session-attendance", sessionId],
    queryFn: () => fetchSessionAttendance(sessionId!),
    enabled: Boolean(sessionId),
  });

  const { data: completionRows = [] } = useQuery({
    queryKey: ["session-completions", sessionId],
    queryFn: () => fetchSessionWorkCompletions(sessionId!),
    enabled: Boolean(sessionId),
  });

  const {
    data: reportData,
    isLoading: reportLoading,
    refetch: refetchReport,
  } = useQuery({
    queryKey: ["sector-report", sessionId],
    queryFn: () => fetchReportBySession(sessionId!),
    enabled: Boolean(sessionId),
    retry: false,
  });

  const session = sessionDetail?.session;
  const report = reportData?.report ?? null;
  const assignmentCount = sessionDetail?.assignments.length ?? 0;

  const attendanceTotal = useMemo(
    () => attendanceRows.reduce((sum, row) => sum + row.record.attended, 0),
    [attendanceRows],
  );

  const generateMutation = useMutation({
    mutationFn: () => generateSectorReport(sessionId!),
    onSuccess: () => {
      toast.success("Report generated");
      void refetchReport();
      void queryClient.invalidateQueries({ queryKey: ["sector-report", sessionId] });
      void queryClient.invalidateQueries({ queryKey: ["cell-exec-reports"] });
    },
    onError: (error: unknown) => {
      toast.error("Report generation failed", {
        description: getApiErrorMessage(error),
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => submitSectorReport(report!.id),
    onSuccess: () => {
      toast.success("Report submitted to sector");
      void refetchReport();
      void queryClient.invalidateQueries({ queryKey: ["sector-report", sessionId] });
      void queryClient.invalidateQueries({ queryKey: ["cell-exec-reports"] });
    },
    onError: (error: unknown) => {
      toast.error("Submission failed", {
        description: getApiErrorMessage(error),
      });
    },
  });

  if (sessionLoading || reportLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner label="Loading report…" />
      </div>
    );
  }

  if (sessionError || !session) {
    return (
      <div className="p-4 lg:p-6">
        <Alert variant="destructive">
          <AlertTitle>Session not found</AlertTitle>
          <AlertDescription>
            This umuganda session could not be loaded. Return to the sessions list and try again.
          </AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" asChild>
          <Link to="/cell-executive/umuganda">
            <ArrowLeftIcon className="size-4" aria-hidden />
            Back to umuganda
          </Link>
        </Button>
      </div>
    );
  }

  const sessionDateLabel = formatDate(session.sessionDate, "EEEE, d MMMM yyyy");
  const isGenerating = generateMutation.isPending;
  const isSubmitting = submitMutation.isPending;

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Sector report"
        description={`Umuganda · ${sessionDateLabel}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={session.status} kind="session" />
            {report ? <StatusBadge status={report.status} kind="report" /> : null}
          </div>
        }
      />

      <StatCardGrid className="py-4 lg:py-6">
        <StatCard label="Attendance recorded" value={attendanceTotal} />
        <StatCard label="Issues assigned" value={assignmentCount} />
        <StatCard label="Outcomes recorded" value={completionRows.length} />
      </StatCardGrid>

      <div className="space-y-6 px-4 pb-8 lg:px-6">
        <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
          <Link to={`/cell-executive/umuganda/${sessionId}/attendance`}>
            <ArrowLeftIcon className="size-4" aria-hidden />
            Back to attendance
          </Link>
        </Button>

        {report?.status === "submitted" && report.submittedAt ? (
          <Alert className="border-[var(--color-brand-green)]/30 bg-[var(--color-brand-green-muted)]">
            <CheckCircle2Icon className="text-[var(--color-brand-green)]" />
            <AlertTitle>Submitted to sector</AlertTitle>
            <AlertDescription>
              This report was approved and sent on{" "}
              {formatDate(report.submittedAt, "d MMM yyyy 'at' HH:mm")}.
            </AlertDescription>
          </Alert>
        ) : null}

        {!report && !isGenerating ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileTextIcon className="size-4" aria-hidden />
                Generate sector report
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Claude will write a formal report for the Sector Executive Secretary using:
              </p>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                <li>
                  Attendance by village ({attendanceRows.length} village
                  {attendanceRows.length === 1 ? "" : "s"} recorded)
                </li>
                <li>
                  Work outcomes for assigned issues ({completionRows.length} of {assignmentCount}{" "}
                  recorded)
                </li>
                <li>Escalations and outstanding items from the session</li>
              </ul>
              {attendanceRows.length === 0 ? (
                <Alert>
                  <AlertTitle>Attendance not recorded yet</AlertTitle>
                  <AlertDescription>
                    Record village attendance before generating the report for accurate numbers.
                  </AlertDescription>
                </Alert>
              ) : null}
              <Button
                className="w-full sm:w-auto"
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
              >
                <SparklesIcon className="size-4" aria-hidden />
                Generate report
              </Button>
              {generateMutation.isError ? (
                <p className="text-sm text-destructive">
                  Report generation failed. Check your connection and try again.
                </p>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {isGenerating ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <LoadingSpinner label="Claude is writing the sector report…" />
              <p className="max-w-sm text-sm text-muted-foreground">
                This usually takes 5–8 seconds. Attendance, work outcomes, and escalations are being
                compiled into a formal document.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {report && !isGenerating ? (
          <>
            <ReportDocument
              reportText={report.reportText}
              keyAchievements={report.keyAchievements}
              escalations={report.escalations}
              attendanceRate={report.attendanceRate}
            />

            {report.status === "draft" ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => submitMutation.mutate()}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting…" : "Approve & submit to sector"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending}
                >
                  <SparklesIcon className="size-4" aria-hidden />
                  Regenerate
                </Button>
              </div>
            ) : null}

            {report.status === "approved" ? (
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => submitMutation.mutate()}
                  disabled={isSubmitting}
                >
                  Submit to sector
                </Button>
              </div>
            ) : null}

            {submitMutation.isError ? (
              <p className="text-sm text-destructive">
                Submission failed. Please try again or contact support.
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
