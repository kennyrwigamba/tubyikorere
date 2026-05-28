import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
  Loader2Icon,
} from "lucide-react";

import { CategoryChip } from "@/components/atoms/CategoryChip";
import { ChannelIcon } from "@/components/atoms/ChannelIcon";
import { SeverityBadge } from "@/components/atoms/SeverityBadge";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchIssueDetail, updateIssueStatus } from "@/lib/api/issues";
import type { IssueDetail } from "@/lib/types/issue";
import { formatDate, formatTimeAgo } from "@/lib/utils";
import { useAppStore } from "@/store";

type ActionDialog = "resolve" | "escalate" | null;

const TIMELINE_STEPS = [
  { key: "submitted", label: "Submitted" },
  { key: "assigned", label: "Assigned" },
  { key: "resolved", label: "Resolved" },
] as const;

function channelLabel(channel: IssueDetail["submissionChannel"]) {
  return channel === "whatsapp" ? "WhatsApp" : "Web";
}

function getTimelineIndex(status: IssueDetail["status"]) {
  if (status === "resolved" || status === "closed") return 2;
  if (status === "assigned" || status === "in_progress" || status === "escalated") return 1;
  return 0;
}

function IssueTimeline({ issue }: { issue: IssueDetail }) {
  const activeIndex = getTimelineIndex(issue.status);

  return (
    <ol className="flex flex-col gap-3 sm:flex-row sm:gap-0">
      {TIMELINE_STEPS.map((step, index) => {
        const isComplete = index <= activeIndex;
        const isCurrent = index === activeIndex;

        return (
          <li key={step.key} className="flex flex-1 items-start gap-3 sm:flex-col sm:items-stretch">
            <div className="flex items-center gap-3 sm:flex-col sm:items-start">
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                  isComplete
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-muted text-muted-foreground"
                }`}
              >
                {index + 1}
              </span>
              <div className="min-w-0 sm:pt-1">
                <p className={`text-sm font-medium ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.label}
                </p>
                {step.key === "submitted" ? (
                  <p className="text-xs text-muted-foreground">{formatDate(issue.createdAt, "d MMM yyyy")}</p>
                ) : null}
                {step.key === "resolved" && issue.status === "resolved" && issue.resolutionNotes ? (
                  <p className="text-xs text-muted-foreground">{formatDate(issue.updatedAt, "d MMM yyyy")}</p>
                ) : null}
              </div>
            </div>
            {index < TIMELINE_STEPS.length - 1 ? (
              <div
                className={`hidden h-px flex-1 self-center sm:mx-2 sm:mt-3.5 sm:block ${
                  index < activeIndex ? "bg-primary" : "bg-border"
                }`}
                aria-hidden
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

export default function CellExecutiveIssueDetailRoute() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { entityId } = useAppStore();
  const [dialog, setDialog] = useState<ActionDialog>(null);
  const [notes, setNotes] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    data: issue,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["cell-exec-issue", id],
    queryFn: () => fetchIssueDetail(id!),
    enabled: Boolean(id),
  });

  const mutation = useMutation({
    mutationFn: async ({ status, resolutionNotes }: { status: "resolved" | "escalated"; resolutionNotes: string }) => {
      await updateIssueStatus(id!, status, resolutionNotes);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cell-exec-issue", id] });
      void queryClient.invalidateQueries({ queryKey: ["cell-exec-issues", entityId] });
      void queryClient.invalidateQueries({ queryKey: ["cell-exec-dashboard-issues", entityId] });
      setDialog(null);
      setNotes("");
      setActionError(null);
    },
    onError: (err) => {
      setActionError(err instanceof Error ? err.message : "Action failed. Please try again.");
    },
  });

  const openDialog = (type: ActionDialog) => {
    setNotes("");
    setActionError(null);
    setDialog(type);
  };

  const submitAction = () => {
    if (notes.trim().length < 10) {
      setActionError("Please enter at least 10 characters.");
      return;
    }
    if (dialog === "resolve") {
      mutation.mutate({ status: "resolved", resolutionNotes: notes.trim() });
    } else if (dialog === "escalate") {
      mutation.mutate({ status: "escalated", resolutionNotes: notes.trim() });
    }
  };

  const isClosed = issue?.status === "resolved" || issue?.status === "closed";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center px-4 py-16 text-sm text-muted-foreground">
        <Loader2Icon className="mr-2 size-4 animate-spin" />
        Loading issue...
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="space-y-4 px-4 py-6 lg:px-6">
        <Alert variant="destructive">
          <AlertTriangleIcon className="size-4" />
          <AlertTitle>Issue not found</AlertTitle>
          <AlertDescription>
            {(error as Error)?.message || "This issue may have been removed."}
          </AlertDescription>
        </Alert>
        <Button variant="outline" asChild>
          <Link to="/cell-executive/issues">Back to issues</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={issue.summary}
        description={`Submitted ${formatTimeAgo(issue.createdAt)} from ${issue.villageName} via ${channelLabel(issue.submissionChannel)}`}
        actions={
          !isClosed ? (
            <>
              <Button variant="outline" size="sm" onClick={() => openDialog("escalate")}>
                Escalate to sector
              </Button>
              <Button size="sm" onClick={() => openDialog("resolve")}>
                Mark resolved
              </Button>
            </>
          ) : null
        }
      />

      <div className="flex flex-col gap-6 px-4 pt-5 pb-6 lg:px-6 lg:pt-6">
        <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
          <Link to="/cell-executive/issues">
            <ArrowLeftIcon className="size-4" />
            Back to issues
          </Link>
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={issue.severity} size="lg" />
          <StatusBadge status={issue.status} />
          <CategoryChip category={issue.category} />
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <ChannelIcon channel={issue.submissionChannel} showTooltip={false} />
            {channelLabel(issue.submissionChannel)}
          </span>
        </div>

        {issue.requiresEscalation && issue.escalationReason ? (
          <Alert>
            <AlertTriangleIcon className="size-4 text-[var(--color-brand-amber)]" />
            <AlertTitle>Flagged for sector escalation</AlertTitle>
            <AlertDescription>{issue.escalationReason}</AlertDescription>
          </Alert>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Original report</CardTitle>
          </CardHeader>
          <CardContent>
            <blockquote className="border-l-2 border-border pl-4 text-sm leading-relaxed text-foreground/90">
              {issue.rawText}
            </blockquote>
            {issue.languageDetected ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Language detected: {issue.languageDetected}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Summary
              </p>
              <p>{issue.summary}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Severity reason
              </p>
              <p className="text-muted-foreground">{issue.severityReason}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Recommended action
              </p>
              <p className="text-muted-foreground">{issue.recommendedAction}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Estimated participants
              </p>
              <p className="font-semibold tabular-nums">{issue.estimatedParticipants}</p>
            </div>
          </CardContent>
        </Card>

        {issue.umugandaSessionId ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Umuganda assignment</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Assigned to session{" "}
              <span className="font-mono text-foreground">{issue.umugandaSessionId.slice(0, 8)}</span>
            </CardContent>
          </Card>
        ) : null}

        {issue.resolutionNotes ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2Icon className="size-4 text-primary" />
                Resolution notes
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{issue.resolutionNotes}</CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <IssueTimeline issue={issue} />
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialog === "resolve" ? "Mark as resolved" : "Escalate to sector"}</DialogTitle>
            <DialogDescription>
              {dialog === "resolve"
                ? "Describe how this issue was resolved. This is recorded for sector reporting."
                : "Confirm escalation and add a note for the sector official."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="action_notes">Notes</Label>
            <Textarea
              id="action_notes"
              rows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder={
                dialog === "resolve"
                  ? "Describe what was done to resolve this issue..."
                  : "Why does this need sector-level attention?"
              }
            />
            {actionError ? <p className="text-xs text-destructive">{actionError}</p> : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button onClick={submitAction} disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : dialog === "resolve" ? "Mark resolved" : "Escalate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
