import { useQuery } from "@tanstack/react-query";
import { AlertTriangleIcon, Building2Icon, PhoneIcon } from "lucide-react";

import { EmptyState } from "@/components/atoms/EmptyState";
import { LoadingSpinner } from "@/components/atoms/LoadingSpinner";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { fetchSectorCells } from "@/lib/api/sector";
import { getApiErrorMessage } from "@/lib/api/errors";
import { formatDate, formatTimeAgo } from "@/lib/utils";

export default function SectorCellsRoute() {
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["sector-cells"],
    queryFn: fetchSectorCells,
  });

  if (isLoading) {
    return <LoadingSpinner label="Loading cells..." fullPage />;
  }

  return (
    <>
      <PageHeader
        title="Cells"
        description="Cells registered in your sector"
      />

      <div className="flex flex-col gap-4 px-4 pt-5 pb-6 lg:px-6 lg:pt-6">
        {error ? (
          <Alert variant="destructive">
            <AlertTriangleIcon className="size-4" />
            <AlertTitle>Failed to load cells</AlertTitle>
            <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
          </Alert>
        ) : data.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {data.map((cell) => (
              <li key={cell.id}>
                <Card className="py-0 shadow-none">
                  <CardContent className="space-y-2 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-base font-semibold">{cell.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {cell.village_count} village{cell.village_count === 1 ? "" : "s"}
                        </p>
                      </div>
                      {cell.last_activity ? (
                        <span className="text-xs text-muted-foreground">
                          Active {formatTimeAgo(cell.last_activity)}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                      {cell.executive_name ? (
                        <span className="text-muted-foreground">
                          Executive: <span className="text-foreground">{cell.executive_name}</span>
                        </span>
                      ) : null}
                      {cell.executive_phone ? (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <PhoneIcon className="size-3.5" aria-hidden />
                          {cell.executive_phone}
                        </span>
                      ) : null}
                    </div>
                    {cell.last_activity ? (
                      <p className="text-xs text-muted-foreground">
                        Last activity: {formatDate(cell.last_activity, "d MMM yyyy")}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={Building2Icon}
            title="No cells"
            description="Cells in your sector will appear here once registered."
          />
        )}
      </div>
    </>
  );
}
