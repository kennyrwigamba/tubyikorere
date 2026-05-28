import { useQuery } from "@tanstack/react-query";
import { AlertTriangleIcon } from "lucide-react";

import { EmptyState } from "@/components/atoms/EmptyState";
import { LoadingSpinner } from "@/components/atoms/LoadingSpinner";
import { IssueCardList } from "@/components/molecules/IssueCard";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { mapIssueRow } from "@/lib/api/issues";
import { fetchSectorEscalations } from "@/lib/api/sector";
import { getApiErrorMessage } from "@/lib/api/errors";

export default function SectorEscalationsRoute() {
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["sector-escalations"],
    queryFn: fetchSectorEscalations,
  });

  const issues = data.map(mapIssueRow);

  if (isLoading) {
    return <LoadingSpinner label="Loading escalations..." fullPage />;
  }

  return (
    <>
      <PageHeader
        title="Escalations"
        description="Issues flagged for sector-level attention across all cells"
      />

      <div className="flex flex-col gap-4 px-4 pt-5 pb-6 lg:px-6 lg:pt-6">
        {error ? (
          <Alert variant="destructive">
            <AlertTriangleIcon className="size-4" />
            <AlertTitle>Failed to load escalations</AlertTitle>
            <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
          </Alert>
        ) : issues.length > 0 ? (
          <IssueCardList issues={issues} />
        ) : (
          <EmptyState
            icon={AlertTriangleIcon}
            title="No escalations"
            description="When cell executives flag issues for sector support, they appear here."
          />
        )}
      </div>
    </>
  );
}
