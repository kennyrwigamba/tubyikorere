import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangleIcon, ChevronRightIcon, FileTextIcon } from "lucide-react";

import { EmptyState } from "@/components/atoms/EmptyState";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { fetchCellReports } from "@/lib/api/reports";
import { formatDate } from "@/lib/utils";
import { useAppStore } from "@/store";

export default function CellExecutiveReportsRoute() {
  const navigate = useNavigate();
  const { entityId } = useAppStore();

  const {
    data: rows = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["cell-exec-reports", entityId],
    queryFn: () => fetchCellReports(entityId),
    enabled: Boolean(entityId),
  });

  return (
    <>
      <PageHeader
        title="Reports"
        description="Generate and submit sector reports after umuganda sessions"
      />

      <div className="flex flex-col gap-4 px-4 pt-5 pb-6 lg:px-6 lg:pt-6">
        {isLoading ? (
          <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
            Loading reports...
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTriangleIcon className="size-4" />
            <AlertTitle>Failed to load reports</AlertTitle>
            <AlertDescription>{(error as Error).message || "Please try again."}</AlertDescription>
          </Alert>
        ) : rows.length > 0 ? (
          <div className="flex flex-col gap-3">
            {rows.map(({ session, report }) => (
              <Card
                key={session.id}
                className="cursor-pointer overflow-hidden py-0 shadow-none transition-colors hover:bg-muted/40 active:scale-[0.99]"
                onClick={() => navigate(`/cell-executive/reports/${session.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigate(`/cell-executive/reports/${session.id}`);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold">
                        {formatDate(session.sessionDate, "EEEE, d MMM yyyy")}
                      </p>
                      <StatusBadge status={session.status} kind="session" size="sm" />
                      {report ? (
                        <StatusBadge status={report.status} kind="report" size="sm" />
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Not generated
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {report
                        ? report.status === "submitted"
                          ? "Submitted to sector"
                          : report.status === "approved"
                            ? "Approved — ready to submit"
                            : "Draft — review and submit"
                        : "Record attendance, then generate the sector report"}
                      {session.actualParticipants != null
                        ? ` · ${session.actualParticipants} attended`
                        : null}
                    </p>
                  </div>
                  <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FileTextIcon}
            title="No reports yet"
            description="Confirm a work plan and record attendance after umuganda. Sessions ready for reporting appear here."
            action={{
              label: "Go to umuganda",
              onClick: () => navigate("/cell-executive/umuganda"),
            }}
          />
        )}
      </div>
    </>
  );
}
