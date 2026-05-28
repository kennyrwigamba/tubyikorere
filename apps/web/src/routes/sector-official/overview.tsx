import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangleIcon,
  ListTodoIcon,
} from "lucide-react";

import { LoadingSpinner } from "@/components/atoms/LoadingSpinner";
import { IssueCardList } from "@/components/molecules/IssueCard";
import { PageHeader } from "@/components/molecules/PageHeader";
import { StatCard, StatCardGrid } from "@/components/molecules/StatCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { mapIssueRow } from "@/lib/api/issues";
import { fetchSectorOverview } from "@/lib/api/sector";
import { getApiErrorMessage } from "@/lib/api/errors";
import { formatDate } from "@/lib/utils";
import { useAppStore } from "@/store";

function reportStatusBadge(status: string | null) {
  if (status === "submitted") {
    return (
      <Badge className="bg-[var(--color-brand-green)]/15 text-[var(--color-brand-green)]">
        Submitted
      </Badge>
    );
  }
  if (status === "draft" || status === "approved") {
    return <Badge variant="secondary">Draft</Badge>;
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      No report
    </Badge>
  );
}

export default function SectorOverviewRoute() {
  const { entityName } = useAppStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ["sector-overview"],
    queryFn: fetchSectorOverview,
  });

  if (isLoading) {
    return <LoadingSpinner label="Loading sector overview..." fullPage />;
  }

  const escalations = (data?.escalations ?? []).map(mapIssueRow);

  return (
    <>
      <PageHeader
        title={entityName || data?.sector.name || "Sector overview"}
        description={
          data
            ? `${data.sector.district} · ${data.sector.province}`
            : "Sector-wide performance and escalations"
        }
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/sector-official/reports">View reports</Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-6 px-4 pt-5 pb-6 lg:px-6 lg:pt-6">
        {error ? (
          <Alert variant="destructive">
            <AlertTriangleIcon className="size-4" />
            <AlertTitle>Failed to load overview</AlertTitle>
            <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
          </Alert>
        ) : null}

        {data ? (
          <>
            <StatCardGrid className="px-0 lg:px-0">
              <StatCard
                label="Cells"
                value={data.stats.total_cells}
                footer="In your sector"
              />
              <StatCard
                label="Reports this month"
                value={data.stats.reports_received_this_month}
                footer="Submitted to sector"
              />
              <StatCard
                label="Open escalations"
                value={data.stats.open_escalations}
                trendLabel="Needs sector attention"
              />
              <StatCard
                label="Resolved this month"
                value={data.stats.resolved_this_month}
                footer="Issues closed"
              />
            </StatCardGrid>

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">Cell status</h2>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/sector-official/cells">All cells</Link>
                </Button>
              </div>
              {data.cells.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                        <th className="px-4 py-2.5 font-medium">Cell</th>
                        <th className="px-4 py-2.5 font-medium">Executive</th>
                        <th className="px-4 py-2.5 font-medium">Open issues</th>
                        <th className="px-4 py-2.5 font-medium">Last report</th>
                        <th className="px-4 py-2.5 font-medium">Last umuganda</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.cells.map((cell) => (
                        <tr key={cell.id} className="border-b last:border-0">
                          <td className="px-4 py-3 font-medium">{cell.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {cell.executive_name ?? "—"}
                          </td>
                          <td className="px-4 py-3">{cell.open_issues}</td>
                          <td className="px-4 py-3">{reportStatusBadge(cell.last_report_status)}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {cell.last_umuganda_date
                              ? formatDate(cell.last_umuganda_date, "d MMM yyyy")
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No cells registered in this sector.</p>
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">Recent escalations</h2>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/sector-official/escalations">
                    <ListTodoIcon className="size-4" aria-hidden />
                    View all
                  </Link>
                </Button>
              </div>
              {escalations.length > 0 ? (
                <IssueCardList issues={escalations.slice(0, 5)} />
              ) : (
                <Card>
                  <CardContent className="py-6 text-sm text-muted-foreground">
                    No escalated issues across sector cells right now.
                  </CardContent>
                </Card>
              )}
            </section>
          </>
        ) : null}
      </div>
    </>
  );
}
