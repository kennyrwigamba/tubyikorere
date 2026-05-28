import { useQuery } from "@tanstack/react-query";
import { AlertTriangleIcon } from "lucide-react";

import { CategoryChip } from "@/components/atoms/CategoryChip";
import { LoadingSpinner } from "@/components/atoms/LoadingSpinner";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { fetchVillageIssues } from "@/lib/api/issues";
import { formatDate } from "@/lib/utils";
import { useAppStore } from "@/store";

export default function CoordinatorVillageRoute() {
  const { userId, userName, entityName, entityId } = useAppStore();

  const { data: issues = [], isLoading, error } = useQuery({
    queryKey: ["coordinator-village-issues", entityId, userId],
    queryFn: () => fetchVillageIssues(entityId, userId),
    enabled: Boolean(entityId && userId),
  });

  if (isLoading) {
    return <LoadingSpinner label="Loading village issues..." fullPage />;
  }

  return (
    <>
      <PageHeader
        title={entityName || "My village"}
        description={userName ? `Coordinator: ${userName}` : "Issue history"}
      />

      <div className="flex flex-col gap-4 px-4 pt-5 pb-6 lg:px-6 lg:pt-6">
        {error ? (
          <Alert variant="destructive">
            <AlertTriangleIcon className="size-4" />
            <AlertTitle>Failed to load issues</AlertTitle>
            <AlertDescription>{(error as Error).message}</AlertDescription>
          </Alert>
        ) : issues.length > 0 ? (
          <div className="flex flex-col gap-3">
            {issues.map((issue) => (
              <Card key={issue.id} className="py-0 shadow-none">
                <CardContent className="space-y-2 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <CategoryChip category={issue.category} />
                    <StatusBadge status={issue.status} kind="issue" size="sm" />
                    <span className="text-xs text-muted-foreground">
                      {formatDate(issue.createdAt, "d MMM yyyy")}
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-snug">{issue.summary}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No issues have been submitted from this village yet.
          </p>
        )}
      </div>
    </>
  );
}
