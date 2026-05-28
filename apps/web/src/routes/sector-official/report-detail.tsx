import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon } from "lucide-react";

import { LoadingSpinner } from "@/components/atoms/LoadingSpinner";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { PageHeader } from "@/components/molecules/PageHeader";
import { ReportDocument } from "@/components/molecules/ReportDocument";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchSectorReport } from "@/lib/api/sector";
import { getApiErrorMessage } from "@/lib/api/errors";
import { formatDate } from "@/lib/utils";

export default function SectorReportDetailRoute() {
  const { reportId } = useParams<{ reportId: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["sector-report", reportId],
    queryFn: () => fetchSectorReport(reportId!),
    enabled: Boolean(reportId),
  });

  if (isLoading) {
    return <LoadingSpinner label="Loading report..." fullPage />;
  }

  if (error || !data) {
    return (
      <div className="px-4 py-6 lg:px-6">
        <Alert variant="destructive">
          <AlertTitle>Report not found</AlertTitle>
          <AlertDescription>{getApiErrorMessage(error, "Unable to load this report.")}</AlertDescription>
        </Alert>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/sector-official/reports">
            <ArrowLeftIcon className="size-4" aria-hidden />
            Back to reports
          </Link>
        </Button>
      </div>
    );
  }

  const { report, session, cell } = data;

  return (
    <>
      <PageHeader
        title={cell.name}
        description={`Umuganda report · ${formatDate(session.sessionDate, "EEEE, d MMMM yyyy")}`}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/sector-official/reports">
              <ArrowLeftIcon className="size-4" aria-hidden />
              All reports
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-4 px-4 pt-5 pb-8 lg:px-6 lg:pt-6">
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 py-4 text-sm">
            <StatusBadge status={report.status} kind="report" size="sm" />
            {report.submittedAt ? (
              <span className="text-muted-foreground">
                Submitted {formatDate(report.submittedAt, "d MMM yyyy 'at' HH:mm")}
              </span>
            ) : null}
            {cell.executiveName ? (
              <span className="text-muted-foreground">Executive: {cell.executiveName}</span>
            ) : null}
            {session.actualParticipants != null ? (
              <span className="text-muted-foreground">
                {session.actualParticipants} participants
              </span>
            ) : null}
          </CardContent>
        </Card>

        <ReportDocument
          reportText={report.reportText}
          keyAchievements={report.keyAchievements}
          escalations={report.escalations}
          attendanceRate={report.attendanceRate}
        />
      </div>
    </>
  );
}
