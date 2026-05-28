import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangleIcon, ChevronRightIcon, FileTextIcon } from "lucide-react";

import { EmptyState } from "@/components/atoms/EmptyState";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchSectorReports } from "@/lib/api/sector";
import { getApiErrorMessage } from "@/lib/api/errors";
import { formatDate } from "@/lib/utils";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export default function SectorReportsRoute() {
  const navigate = useNavigate();
  const [month, setMonth] = useState(currentMonth);

  const { data, isLoading, error } = useQuery({
    queryKey: ["sector-reports", month],
    queryFn: () => fetchSectorReports(month),
  });

  const submittedCount = useMemo(() => {
    if (!data) return 0;
    return data.cells.reduce(
      (sum, row) =>
        sum + row.sessions.filter((entry) => entry.report?.status === "submitted").length,
      0,
    );
  }, [data]);

  const totalSessions = useMemo(() => {
    if (!data) return 0;
    return data.cells.reduce((sum, row) => sum + row.sessions.length, 0);
  }, [data]);

  return (
    <>
      <PageHeader
        title="Reports"
        description="Submitted sector reports from cell executives"
      />

      <div className="flex flex-col gap-4 px-4 pt-5 pb-6 lg:px-6 lg:pt-6">
        <Card>
          <CardContent className="flex flex-wrap items-end gap-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="report-month">Month</Label>
              <Input
                id="report-month"
                type="month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                className="w-auto"
              />
            </div>
            {data ? (
              <p className="text-sm text-muted-foreground">
                {submittedCount} submitted · {totalSessions} session
                {totalSessions === 1 ? "" : "s"} in period
              </p>
            ) : null}
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
            Loading reports...
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTriangleIcon className="size-4" />
            <AlertTitle>Failed to load reports</AlertTitle>
            <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
          </Alert>
        ) : data && data.cells.some((row) => row.sessions.length > 0) ? (
          <div className="flex flex-col gap-6">
            {data.cells.map(({ cell, sessions }) =>
              sessions.length > 0 ? (
                <section key={cell.id} className="space-y-3">
                  <h2 className="text-base font-semibold">{cell.name}</h2>
                  <div className="flex flex-col gap-2">
                    {sessions.map(({ session, report }) => (
                      <Card
                        key={session.id}
                        className={
                          report?.status === "submitted"
                            ? "cursor-pointer overflow-hidden py-0 shadow-none transition-colors hover:bg-muted/40 active:scale-[0.99]"
                            : "overflow-hidden py-0 opacity-75 shadow-none"
                        }
                        onClick={() => {
                          if (report?.status === "submitted") {
                            navigate(`/sector-official/reports/${report.id}`);
                          }
                        }}
                        onKeyDown={(event) => {
                          if (
                            report?.status === "submitted" &&
                            (event.key === "Enter" || event.key === " ")
                          ) {
                            event.preventDefault();
                            navigate(`/sector-official/reports/${report.id}`);
                          }
                        }}
                        role={report?.status === "submitted" ? "button" : undefined}
                        tabIndex={report?.status === "submitted" ? 0 : undefined}
                      >
                        <CardContent className="flex items-center gap-4 py-4">
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold">
                                {formatDate(session.sessionDate, "EEEE, d MMM yyyy")}
                              </p>
                              <StatusBadge status={session.status} kind="session" size="sm" />
                              {report ? (
                                <StatusBadge status={report.status} kind="report" size="sm" />
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground">
                                  Not submitted
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {report?.status === "submitted"
                                ? `Submitted ${report.submittedAt ? formatDate(report.submittedAt, "d MMM yyyy") : ""}`
                                : "Awaiting cell executive submission"}
                              {session.actualParticipants != null
                                ? ` · ${session.actualParticipants} attended`
                                : null}
                            </p>
                          </div>
                          {report?.status === "submitted" ? (
                            <ChevronRightIcon
                              className="size-4 shrink-0 text-muted-foreground"
                              aria-hidden
                            />
                          ) : null}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              ) : null,
            )}
          </div>
        ) : (
          <EmptyState
            icon={FileTextIcon}
            title="No sessions this month"
            description="Umuganda sessions with reports appear here once cell executives submit them."
          />
        )}
      </div>
    </>
  );
}
