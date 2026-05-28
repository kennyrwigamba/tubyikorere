import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangleIcon,
  Building2Icon,
  MapPinIcon,
  UsersIcon,
} from "lucide-react";

import { LoadingSpinner } from "@/components/atoms/LoadingSpinner";
import { PageHeader } from "@/components/molecules/PageHeader";
import { StatCard, StatCardGrid } from "@/components/molecules/StatCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchAdminDashboard } from "@/lib/api/admin";
import { getApiErrorMessage } from "@/lib/api/errors";
import { formatDate } from "@/lib/utils";

function actionLabel(action: string) {
  switch (action) {
    case "issue_submitted":
      return "Issue submitted";
    case "report_submitted":
      return "Report submitted";
    case "attendance_recorded":
      return "Attendance recorded";
    case "session_updated":
      return "Session updated";
    default:
      return action.replace(/_/g, " ");
  }
}

export default function AdminDashboardRoute() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: fetchAdminDashboard,
  });

  if (isLoading) {
    return <LoadingSpinner label="Loading dashboard..." fullPage />;
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="System health and recent activity"
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/hierarchy">Manage hierarchy</Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-6 px-4 pt-5 pb-6 lg:px-6 lg:pt-6">
        {error ? (
          <Alert variant="destructive">
            <AlertTriangleIcon className="size-4" />
            <AlertTitle>Failed to load dashboard</AlertTitle>
            <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
          </Alert>
        ) : null}

        {data ? (
          <>
            <StatCardGrid className="px-0 lg:px-0">
              <StatCard label="Provinces" value={data.counts.provinces} footer="Top-level regions" />
              <StatCard label="Districts" value={data.counts.districts} footer="Administrative districts" />
              <StatCard label="Sectors" value={data.counts.sectors} footer="Sector offices" />
              <StatCard label="Cells" value={data.counts.cells} footer="Cell executives" />
              <StatCard label="Villages" value={data.counts.villages} footer="Village coordinators" />
              <StatCard
                label="Portal users"
                value={data.counts.users}
                footer="Executives, coordinators, officials"
              />
            </StatCardGrid>

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">Recent activity</h2>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/admin/activity">View all</Link>
                </Button>
              </div>
              {data.recent_activity.length > 0 ? (
                <Card>
                  <CardContent className="divide-y divide-border p-0">
                    {data.recent_activity.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <p className="text-sm font-medium">{actionLabel(entry.action)}</p>
                          <p className="line-clamp-2 text-sm text-muted-foreground">{entry.detail}</p>
                        </div>
                        <div className="shrink-0 text-xs text-muted-foreground">
                          <p>{entry.entity}</p>
                          <p>{formatDate(entry.timestamp, "d MMM yyyy HH:mm")}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-6 text-sm text-muted-foreground">
                    No activity recorded yet.
                  </CardContent>
                </Card>
              )}
            </section>

            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPinIcon className="size-4 text-muted-foreground" aria-hidden />
                    Hierarchy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Edit provinces, cells, villages, and reset PINs.
                  </p>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/admin/hierarchy">Open hierarchy</Link>
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <UsersIcon className="size-4 text-muted-foreground" aria-hidden />
                    Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 text-sm text-muted-foreground">
                    View all portal users across roles.
                  </p>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/admin/users">Manage users</Link>
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building2Icon className="size-4 text-muted-foreground" aria-hidden />
                    Activity log
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Full audit trail of system events.
                  </p>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/admin/activity">View activity</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
