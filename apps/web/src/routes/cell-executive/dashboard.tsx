import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangleIcon, CalendarDaysIcon, FileTextIcon, ListTodoIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { IssueCardList } from "@/components/molecules/IssueCard";
import { PageHeader } from "@/components/molecules/PageHeader";
import { StatCard, StatCardGrid } from "@/components/molecules/StatCard";
import { api } from "@/lib/api";
import { fetchCellIssues } from "@/lib/api/issues";
import type { IssuePreview } from "@/lib/types/issue";
import { formatDate } from "@/lib/utils";
import { useAppStore } from "@/store";

type SessionApiRow = {
  id: string;
  sessionDate: string;
  status: "planned" | "active" | "completed";
};

async function fetchSessions(cellId: string): Promise<SessionApiRow[]> {
  const { data } = await api.get<SessionApiRow[]>("/api/umuganda", {
    params: { cell_id: cellId },
  });
  return data;
}

function statusOpenForWork(status: IssuePreview["status"]) {
  return status === "open" || status === "assigned" || status === "in_progress" || status === "escalated";
}

export default function CellExecutiveDashboardRoute() {
  const navigate = useNavigate();
  const { entityId, entityName } = useAppStore();

  const {
    data: issues = [],
    isLoading: issuesLoading,
    error: issuesError,
  } = useQuery({
    queryKey: ["cell-exec-dashboard-issues", entityId],
    queryFn: () => fetchCellIssues(entityId),
    enabled: Boolean(entityId),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["cell-exec-dashboard-sessions", entityId],
    queryFn: () => fetchSessions(entityId),
    enabled: Boolean(entityId),
  });

  const activeIssues = issues.filter((issue) => statusOpenForWork(issue.status));
  const criticalIssues = activeIssues.filter((issue) => issue.severity >= 4);
  const topIssues = [...issues].sort((a, b) => b.severity - a.severity).slice(0, 3);
  const escalationCount = activeIssues.filter((issue) => issue.requiresEscalation).length;

  const nextSession = [...sessions]
    .filter((session) => session.status === "planned" || session.status === "active")
    .sort((a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime())[0];

  const completedSessions = sessions.filter((session) => session.status === "completed");
  const lastReportStatus = completedSessions.length > 0 ? "Ready to generate" : "Not generated";

  return (
    <div className="space-y-6">
      <PageHeader
        title={entityName || "Cell Executive Dashboard"}
        description="Today’s priorities and umuganda readiness"
        actions={
          <>
            <Button asChild size="sm">
              <Link to="/cell-executive/umuganda">Plan Umuganda</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/cell-executive/reports">Generate Report</Link>
            </Button>
          </>
        }
      />

      {escalationCount > 0 ? (
        <div className="px-4 lg:px-6">
          <Alert>
            <AlertTriangleIcon className="size-4 text-[var(--color-brand-amber)]" />
            <AlertTitle>{escalationCount} issues need sector attention</AlertTitle>
            <AlertDescription>
              Review flagged issues and escalate where needed before next umuganda.
            </AlertDescription>
          </Alert>
        </div>
      ) : null}

      <StatCardGrid>
        <StatCard
          label="Open issues"
          value={activeIssues.length}
          trendLabel="Issues requiring action now"
          className="border-l-2 border-l-[var(--color-brand-green)]"
        />
        <StatCard
          label="Critical issues (4–5)"
          value={criticalIssues.length}
          trendLabel="High priority for planning"
          className="border-l-2 border-l-[var(--color-brand-amber)]"
        />
        <StatCard
          label="Next umuganda"
          value={nextSession ? formatDate(nextSession.sessionDate, "d MMM yyyy") : "Not scheduled"}
          footer={nextSession ? `Status: ${nextSession.status}` : "Create a new session"}
        />
        <StatCard
          label="Last report status"
          value={lastReportStatus}
          footer={completedSessions.length > 0 ? "Latest session completed" : "No completed sessions yet"}
        />
      </StatCardGrid>

      <section className="space-y-3 px-4 lg:px-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Top issues by severity</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/cell-executive/issues">View all issues</Link>
          </Button>
        </div>

        {issuesLoading ? (
          <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">Loading issues...</div>
        ) : issuesError ? (
          <Alert variant="destructive">
            <AlertTriangleIcon className="size-4" />
            <AlertTitle>Failed to load dashboard data</AlertTitle>
            <AlertDescription>
              {(issuesError as Error).message || "Please try again."}
            </AlertDescription>
          </Alert>
        ) : topIssues.length > 0 ? (
          <IssueCardList
            issues={topIssues}
            onIssueClick={(issue) => navigate(`/cell-executive/issues/${issue.id}`)}
          />
        ) : (
          <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
            No issues yet. Once citizens submit reports, they appear here.
          </div>
        )}
      </section>

      <section className="space-y-3 px-4 pb-4 lg:px-6">
        <h2 className="text-lg font-semibold">Quick actions</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Button asChild variant="outline" className="h-11 justify-start gap-2">
            <Link to="/cell-executive/issues">
              <ListTodoIcon className="size-4" />
              Review issues
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-11 justify-start gap-2">
            <Link to="/cell-executive/umuganda">
              <CalendarDaysIcon className="size-4" />
              Plan umuganda
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-11 justify-start gap-2">
            <Link to="/cell-executive/reports">
              <FileTextIcon className="size-4" />
              Generate report
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

