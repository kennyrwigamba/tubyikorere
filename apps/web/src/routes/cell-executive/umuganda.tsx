import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangleIcon, CalendarPlusIcon, ChevronDownIcon } from "lucide-react";

import { EmptyState } from "@/components/atoms/EmptyState";
import { PageHeader } from "@/components/molecules/PageHeader";
import { SessionCard } from "@/components/molecules/SessionCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createUmugandaSession,
  fetchCellSessions,
  getNextUmugandaDate,
  sessionDetailPath,
  splitSessionsByUpcoming,
} from "@/lib/api/umuganda";
import { useAppStore } from "@/store";

export default function CellExecutiveUmugandaRoute() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { entityId } = useAppStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [sessionDate, setSessionDate] = useState(getNextUmugandaDate());
  const [expectedParticipants, setExpectedParticipants] = useState("150");
  const [formError, setFormError] = useState<string | null>(null);
  const [pastOpen, setPastOpen] = useState(false);

  const {
    data: sessions = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["cell-exec-sessions", entityId],
    queryFn: () => fetchCellSessions(entityId),
    enabled: Boolean(entityId),
  });

  const { upcoming, past } = useMemo(() => splitSessionsByUpcoming(sessions), [sessions]);

  const createMutation = useMutation({
    mutationFn: () => {
      const participants = Number(expectedParticipants);
      if (!Number.isFinite(participants) || participants <= 0) {
        throw new Error("Enter a valid number of expected participants.");
      }
      if (!sessionDate) {
        throw new Error("Session date is required.");
      }
      return createUmugandaSession({
        cell_id: entityId,
        session_date: sessionDate,
        expected_participants: participants,
      });
    },
    onSuccess: (session) => {
      void queryClient.invalidateQueries({ queryKey: ["cell-exec-sessions", entityId] });
      setCreateOpen(false);
      setFormError(null);
      navigate(sessionDetailPath(session));
    },
    onError: (err) => {
      setFormError(err instanceof Error ? err.message : "Unable to create session.");
    },
  });

  const openCreateDialog = () => {
    setSessionDate(getNextUmugandaDate());
    setExpectedParticipants("150");
    setFormError(null);
    setCreateOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Umuganda"
        description="Plan sessions, assign work, and track attendance"
        actions={
          <Button size="sm" onClick={openCreateDialog}>
            <CalendarPlusIcon className="size-4" />
            Create session
          </Button>
        }
      />

      <div className="flex flex-col gap-6 px-4 pt-5 pb-6 lg:px-6 lg:pt-6">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Upcoming</h2>

          {isLoading ? (
            <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
              Loading sessions...
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTriangleIcon className="size-4" />
              <AlertTitle>Failed to load sessions</AlertTitle>
              <AlertDescription>{(error as Error).message || "Please try again."}</AlertDescription>
            </Alert>
          ) : upcoming.length > 0 ? (
            <div className="flex flex-col gap-3">
              {upcoming.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onClick={() => navigate(sessionDetailPath(session))}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CalendarPlusIcon}
              title="No upcoming sessions"
              description="Create a session for the next umuganda day to start planning work."
              action={{ label: "Create session", onClick: openCreateDialog }}
            />
          )}
        </section>

        {past.length > 0 ? (
          <Collapsible open={pastOpen} onOpenChange={setPastOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between px-0 hover:bg-transparent">
                <span className="text-lg font-semibold">Past sessions ({past.length})</span>
                <ChevronDownIcon
                  className={`size-4 transition-transform ${pastOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 flex flex-col gap-3">
              {past.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onClick={() => navigate(sessionDetailPath(session))}
                />
              ))}
            </CollapsibleContent>
          </Collapsible>
        ) : null}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create umuganda session</DialogTitle>
            <DialogDescription>
              Last Saturday of the month · default date pre-filled
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="session_date">Session date</Label>
              <Input
                id="session_date"
                type="date"
                value={sessionDate}
                onChange={(event) => setSessionDate(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="expected_participants">Expected participants</Label>
              <Input
                id="expected_participants"
                type="number"
                min={1}
                inputMode="numeric"
                value={expectedParticipants}
                onChange={(event) => setExpectedParticipants(event.target.value)}
              />
            </div>

            {formError ? <p className="text-xs text-destructive">{formError}</p> : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={createMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
