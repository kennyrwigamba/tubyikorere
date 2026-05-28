import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertCircleIcon, ArrowLeftIcon } from "lucide-react";

import { CategoryChip } from "@/components/atoms/CategoryChip";
import { LoadingSpinner } from "@/components/atoms/LoadingSpinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchIssueTrack } from "@/lib/api/issues";
import { getApiErrorMessage } from "@/lib/api/errors";
import { formatDate } from "@/lib/utils";

export default function TrackIssueRoute() {
  const { issueId = "" } = useParams<{ issueId: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["issue-track", issueId],
    queryFn: () => fetchIssueTrack(issueId),
    enabled: issueId.length >= 8,
    retry: false,
  });

  if (issueId.length > 0 && issueId.length < 8) {
    return (
      <TrackShell>
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Invalid reference</AlertTitle>
          <AlertDescription>
            Enter at least 8 characters from your issue reference.
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/submit">
            <ArrowLeftIcon className="size-4" aria-hidden />
            Submit a new issue
          </Link>
        </Button>
      </TrackShell>
    );
  }

  if (isLoading) {
    return (
      <TrackShell>
        <LoadingSpinner label="Looking up your issue..." />
      </TrackShell>
    );
  }

  if (error || !data) {
    return (
      <TrackShell>
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Issue not found</AlertTitle>
          <AlertDescription>
            {getApiErrorMessage(error, "Check the reference and try again.")}
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/submit">
            <ArrowLeftIcon className="size-4" aria-hidden />
            Submit a new issue
          </Link>
        </Button>
      </TrackShell>
    );
  }

  return (
    <TrackShell>
      <Card>
        <CardHeader>
          <p className="text-sm font-semibold text-primary">Tubyikorere</p>
          <CardTitle>Issue status / Imiterere y&apos;ikibazo</CardTitle>
          <CardDescription>Reference: {data.reference.toUpperCase()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Status / Imiterere
            </p>
            <p className="text-base font-semibold">{data.status_label_en}</p>
            <p className="text-sm text-muted-foreground">{data.status_label_rw}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <CategoryChip category={data.category} />
            <span className="text-sm text-muted-foreground">{data.village_name}</span>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Summary / Incamake
            </p>
            <p className="text-sm leading-relaxed">{data.summary}</p>
          </div>

          {data.resolution_notes ? (
            <div className="space-y-1 rounded-lg border bg-muted/30 p-4">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Resolution notes / Ibisobanuro by&apos;ikemura
              </p>
              <p className="text-sm leading-relaxed">{data.resolution_notes}</p>
            </div>
          ) : null}

          <div className="grid gap-2 text-sm text-muted-foreground">
            <p>Submitted: {formatDate(data.submitted_at, "d MMM yyyy")}</p>
            {data.resolved_at ? (
              <p>Resolved: {formatDate(data.resolved_at, "d MMM yyyy")}</p>
            ) : (
              <p>Last updated: {formatDate(data.updated_at, "d MMM yyyy")}</p>
            )}
          </div>

          <Button asChild variant="outline" className="w-full">
            <Link to="/submit">
              <ArrowLeftIcon className="size-4" aria-hidden />
              Submit another issue
            </Link>
          </Button>
        </CardContent>
      </Card>
    </TrackShell>
  );
}

function TrackShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto flex min-h-svh w-full max-w-lg flex-col justify-center px-4 py-8">
        {children}
      </div>
    </main>
  );
}
