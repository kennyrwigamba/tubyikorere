import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangleIcon } from "lucide-react";

import { EmptyState } from "@/components/atoms/EmptyState";
import { LoadingSpinner } from "@/components/atoms/LoadingSpinner";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchAdminActivity } from "@/lib/api/admin";
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

function roleLabel(role: string) {
  switch (role) {
    case "cell_executive":
      return "Cell executive";
    case "village_coordinator":
      return "Coordinator";
    case "sector_official":
      return "Sector official";
    case "citizen":
      return "Citizen";
    default:
      return role.replace(/_/g, " ");
  }
}

export default function AdminActivityRoute() {
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["admin-activity", roleFilter],
    queryFn: () =>
      fetchAdminActivity({
        limit: 100,
        role: roleFilter === "all" ? undefined : roleFilter,
      }),
  });

  if (isLoading) {
    return <LoadingSpinner label="Loading activity..." fullPage />;
  }

  return (
    <>
      <PageHeader title="Activity" description="Audit log of significant system events" />

      <div className="flex flex-col gap-4 px-4 pt-5 pb-6 lg:px-6 lg:pt-6">
        <div className="space-y-1.5">
          <Label>Filter by actor role</Label>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="citizen">Citizen</SelectItem>
              <SelectItem value="cell_executive">Cell executive</SelectItem>
              <SelectItem value="village_coordinator">Village coordinator</SelectItem>
              <SelectItem value="sector_official">Sector official</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertTriangleIcon className="size-4" />
            <AlertTitle>Failed to load activity</AlertTitle>
            <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
          </Alert>
        ) : data.length > 0 ? (
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {data.map((entry) => (
                <div key={entry.id} className="space-y-2 px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{actionLabel(entry.action)}</p>
                    <Badge variant="outline">{roleLabel(entry.actor_role)}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(entry.timestamp, "d MMM yyyy HH:mm")}
                    </span>
                  </div>
                  <p className="text-sm">{entry.detail}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.actor_name} · {entry.entity}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            icon={AlertTriangleIcon}
            title="No activity"
            description="Events appear here as citizens submit issues and portal users take action."
          />
        )}
      </div>
    </>
  );
}
