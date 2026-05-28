import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
  FileTextIcon,
} from "lucide-react";

import { LoadingSpinner } from "@/components/atoms/LoadingSpinner";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchSessionWorkCompletions,
  fetchSessionAttendance,
  saveVillageAttendance,
  saveWorkCompletion,
} from "@/lib/api/attendance";
import { getApiErrorMessage } from "@/lib/api/errors";
import { fetchCellVillages } from "@/lib/api/villages";
import { completeSession, fetchSessionDetail } from "@/lib/api/umuganda";
import { formatDate } from "@/lib/utils";
import { useAppStore } from "@/store";

type VillageDraft = {
  attended: string;
  absent: string;
  saved: boolean;
  saving: boolean;
  error: string | null;
};

type OutcomeDraft = {
  status: "" | "resolved" | "partial" | "escalated";
  notes: string;
  saved: boolean;
  saving: boolean;
  error: string | null;
};

function parseCount(value: string): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) return null;
  return n;
}

export default function CellExecutiveUmugandaAttendanceRoute() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { entityId, userName } = useAppStore();
  const [villageDrafts, setVillageDrafts] = useState<Record<string, VillageDraft>>({});
  const [outcomeDrafts, setOutcomeDrafts] = useState<Record<string, OutcomeDraft>>({});

  const {
    data: sessionDetail,
    isLoading: sessionLoading,
    error: sessionError,
  } = useQuery({
    queryKey: ["cell-exec-session", id],
    queryFn: () => fetchSessionDetail(id!),
    enabled: Boolean(id),
  });

  const { data: villages = [], isLoading: villagesLoading } = useQuery({
    queryKey: ["cell-villages", entityId],
    queryFn: () => fetchCellVillages(entityId),
    enabled: Boolean(entityId),
  });

  const { data: attendanceRows = [] } = useQuery({
    queryKey: ["session-attendance", id],
    queryFn: () => fetchSessionAttendance(id!),
    enabled: Boolean(id),
  });

  const { data: completionRows = [] } = useQuery({
    queryKey: ["session-completions", id],
    queryFn: () => fetchSessionWorkCompletions(id!),
    enabled: Boolean(id),
  });

  const session = sessionDetail?.session;
  const assignments = useMemo(
    () => sessionDetail?.assignments ?? [],
    [sessionDetail?.assignments],
  );

  useEffect(() => {
    if (!villages.length) return;
    setVillageDrafts((prev) => {
      const next = { ...prev };
      for (const village of villages) {
        const existing = attendanceRows.find((row) => row.record.villageId === village.id);
        if (!next[village.id] || existing) {
          next[village.id] = {
            attended: existing ? String(existing.record.attended) : "",
            absent: existing ? String(existing.record.absent) : "",
            saved: Boolean(existing),
            saving: false,
            error: null,
          };
        }
      }
      return next;
    });
  }, [villages, attendanceRows]);

  useEffect(() => {
    if (!assignments.length) return;
    setOutcomeDrafts((prev) => {
      const next = { ...prev };
      for (const row of assignments) {
        const issueId = row.assignment.issueId;
        const existing = completionRows.find((item) => item.completion.issueId === issueId);
        if (!next[issueId] || existing) {
          next[issueId] = {
            status: existing?.completion.completionStatus ?? "",
            notes: existing?.completion.completionNotes ?? "",
            saved: Boolean(existing),
            saving: false,
            error: null,
          };
        }
      }
      return next;
    });
  }, [assignments, completionRows]);

  const attendanceSavedCount = useMemo(
    () => Object.values(villageDrafts).filter((draft) => draft.saved).length,
    [villageDrafts],
  );

  const runningTotal = useMemo(() => {
    return Object.values(villageDrafts).reduce((sum, draft) => {
      const attended = parseCount(draft.attended);
      return sum + (attended ?? 0);
    }, 0);
  }, [villageDrafts]);

  const allOutcomesRecorded = useMemo(() => {
    if (!assignments.length) return false;
    return assignments.every((row) => outcomeDrafts[row.assignment.issueId]?.saved);
  }, [assignments, outcomeDrafts]);

  const outcomesSavedCount = useMemo(
    () => Object.values(outcomeDrafts).filter((draft) => draft.saved).length,
    [outcomeDrafts],
  );

  const showOutcomes = attendanceSavedCount > 0 && assignments.length > 0;

  const saveVillage = async (villageId: string, villageName: string) => {
    const draft = villageDrafts[villageId];
    if (!draft || !id) return;

    const attended = parseCount(draft.attended);
    const absent = parseCount(draft.absent);
    if (attended === null || absent === null) {
      setVillageDrafts((prev) => ({
        ...prev,
        [villageId]: { ...draft, error: "Enter whole numbers for attended and absent." },
      }));
      return;
    }

    setVillageDrafts((prev) => ({
      ...prev,
      [villageId]: { ...draft, saving: true, error: null },
    }));

    try {
      await saveVillageAttendance({
        session_id: id,
        village_id: villageId,
        village_name: villageName,
        attended,
        absent,
        recorded_by: userName || "Cell Executive",
      });
      setVillageDrafts((prev) => ({
        ...prev,
        [villageId]: { ...prev[villageId], saving: false, saved: true, error: null },
      }));
      void queryClient.invalidateQueries({ queryKey: ["session-attendance", id] });
      void queryClient.invalidateQueries({ queryKey: ["cell-exec-session", id] });
    } catch (error) {
      setVillageDrafts((prev) => ({
        ...prev,
        [villageId]: {
          ...prev[villageId],
          saving: false,
          error: getApiErrorMessage(error, "Save failed."),
        },
      }));
    }
  };

  const saveOutcome = async (issueId: string) => {
    const draft = outcomeDrafts[issueId];
    if (!draft || !id) return;

    if (!draft.status) {
      setOutcomeDrafts((prev) => ({
        ...prev,
        [issueId]: { ...draft, error: "Select an outcome." },
      }));
      return;
    }
    if (draft.notes.trim().length < 5) {
      setOutcomeDrafts((prev) => ({
        ...prev,
        [issueId]: { ...draft, error: "Add a short note (at least 5 characters)." },
      }));
      return;
    }

    setOutcomeDrafts((prev) => ({
      ...prev,
      [issueId]: { ...draft, saving: true, error: null },
    }));

    try {
      await saveWorkCompletion({
        session_id: id,
        issue_id: issueId,
        completion_status: draft.status,
        completion_notes: draft.notes.trim(),
      });
      setOutcomeDrafts((prev) => ({
        ...prev,
        [issueId]: { ...prev[issueId], saving: false, saved: true, error: null },
      }));
      void queryClient.invalidateQueries({ queryKey: ["session-completions", id] });
      void queryClient.invalidateQueries({ queryKey: ["cell-exec-issues", entityId] });

      const allSavedNow = assignments.every((row) => {
        const assignedIssueId = row.assignment.issueId;
        if (assignedIssueId === issueId) return true;
        return outcomeDrafts[assignedIssueId]?.saved;
      });
      if (allSavedNow) {
        try {
          await completeSession(id);
          void queryClient.invalidateQueries({ queryKey: ["cell-exec-session", id] });
          void queryClient.invalidateQueries({ queryKey: ["cell-exec-sessions", entityId] });
        } catch {
          // Non-blocking
        }
      }
    } catch (error) {
      setOutcomeDrafts((prev) => ({
        ...prev,
        [issueId]: {
          ...prev[issueId],
          saving: false,
          error: getApiErrorMessage(error, "Save failed."),
        },
      }));
    }
  };

  if (sessionLoading || villagesLoading) {
    return <LoadingSpinner label="Loading attendance..." fullPage />;
  }

  if (sessionError || !session) {
    return (
      <div className="space-y-4 px-4 py-6 lg:px-6">
        <Alert variant="destructive">
          <AlertTriangleIcon className="size-4" />
          <AlertTitle>Session not found</AlertTitle>
          <AlertDescription>
            {(sessionError as Error)?.message || "This session may have been removed."}
          </AlertDescription>
        </Alert>
        <Button variant="outline" asChild>
          <Link to="/cell-executive/umuganda">Back to sessions</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Record attendance"
        description={formatDate(session.sessionDate, "EEEE, d MMMM yyyy")}
        actions={
          allOutcomesRecorded ? (
            <Button asChild size="sm">
              <Link to={`/cell-executive/reports/${id}`}>
                <FileTextIcon className="size-4" />
                Go to report
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="flex flex-col gap-6 px-4 pt-5 pb-6 lg:px-6 lg:pt-6">
        <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
          <Link to="/cell-executive/umuganda">
            <ArrowLeftIcon className="size-4" />
            Back to sessions
          </Link>
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={session.status} kind="session" />
          <span className="text-sm text-muted-foreground">
            {assignments.length} issues assigned · {attendanceSavedCount}/{villages.length} villages
            saved
          </span>
        </div>

        {assignments.length === 0 ? (
          <Alert>
            <AlertTriangleIcon className="size-4" />
            <AlertTitle>No work plan yet</AlertTitle>
            <AlertDescription>
              Generate and confirm a plan before recording attendance.{" "}
              <Link to={`/cell-executive/umuganda/${id}/plan`} className="underline">
                Go to planning
              </Link>
            </AlertDescription>
          </Alert>
        ) : session.status === "planned" ? (
          <Alert>
            <AlertTriangleIcon className="size-4" />
            <AlertTitle>Plan not confirmed</AlertTitle>
            <AlertDescription>
              Confirm the work plan first so villages know their assignments.{" "}
              <Link to={`/cell-executive/umuganda/${id}/plan`} className="underline">
                Confirm plan
              </Link>
            </AlertDescription>
          </Alert>
        ) : null}

        {showOutcomes && !allOutcomesRecorded ? (
          <Alert>
            <AlertTitle>Work outcomes ({outcomesSavedCount}/{assignments.length})</AlertTitle>
            <AlertDescription>
              Record an outcome for each assigned issue to unlock the sector report.
            </AlertDescription>
          </Alert>
        ) : null}

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Attendance by village</h2>

          <div className="hidden md:block">
            <Card className="py-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Village</TableHead>
                    <TableHead>Coordinator</TableHead>
                    <TableHead className="w-28">Attended</TableHead>
                    <TableHead className="w-28">Absent</TableHead>
                    <TableHead className="w-32" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {villages.map((village) => {
                    const draft = villageDrafts[village.id] ?? {
                      attended: "",
                      absent: "",
                      saved: false,
                      saving: false,
                      error: null,
                    };
                    return (
                      <TableRow key={village.id}>
                        <TableCell className="font-medium">{village.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {village.coordinator_name ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            inputMode="numeric"
                            value={draft.attended}
                            disabled={draft.saved}
                            onChange={(e) =>
                              setVillageDrafts((prev) => ({
                                ...prev,
                                [village.id]: { ...draft, attended: e.target.value, saved: false },
                              }))
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            inputMode="numeric"
                            value={draft.absent}
                            disabled={draft.saved}
                            onChange={(e) =>
                              setVillageDrafts((prev) => ({
                                ...prev,
                                [village.id]: { ...draft, absent: e.target.value, saved: false },
                              }))
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {draft.saved ? (
                            <span className="inline-flex items-center gap-1 text-xs text-primary">
                              <CheckCircle2Icon className="size-3.5" />
                              Saved
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              disabled={draft.saving}
                              onClick={() => void saveVillage(village.id, village.name)}
                            >
                              {draft.saving ? "Saving..." : "Save"}
                            </Button>
                          )}
                          {draft.error ? (
                            <p className="mt-1 text-xs text-destructive">{draft.error}</p>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </div>

          <div className="flex flex-col gap-3 md:hidden">
            {villages.map((village) => {
              const draft = villageDrafts[village.id] ?? {
                attended: "",
                absent: "",
                saved: false,
                saving: false,
                error: null,
              };
              return (
                <Card key={village.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{village.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {village.coordinator_name ?? "Coordinator not set"}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor={`attended-${village.id}`}>Attended</Label>
                        <Input
                          id={`attended-${village.id}`}
                          type="number"
                          min={0}
                          inputMode="numeric"
                          value={draft.attended}
                          disabled={draft.saved}
                          onChange={(e) =>
                            setVillageDrafts((prev) => ({
                              ...prev,
                              [village.id]: { ...draft, attended: e.target.value, saved: false },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`absent-${village.id}`}>Absent</Label>
                        <Input
                          id={`absent-${village.id}`}
                          type="number"
                          min={0}
                          inputMode="numeric"
                          value={draft.absent}
                          disabled={draft.saved}
                          onChange={(e) =>
                            setVillageDrafts((prev) => ({
                              ...prev,
                              [village.id]: { ...draft, absent: e.target.value, saved: false },
                            }))
                          }
                        />
                      </div>
                    </div>
                    {draft.error ? <p className="text-xs text-destructive">{draft.error}</p> : null}
                    {draft.saved ? (
                      <p className="inline-flex items-center gap-1 text-sm text-primary">
                        <CheckCircle2Icon className="size-4" />
                        Saved
                      </p>
                    ) : (
                      <Button
                        className="h-11 w-full"
                        disabled={draft.saving}
                        onClick={() => void saveVillage(village.id, village.name)}
                      >
                        {draft.saving ? "Saving..." : "Save attendance"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <p className="text-sm font-medium tabular-nums">
            Running total attended: {runningTotal}
          </p>
        </section>

        {showOutcomes ? (
          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Work outcomes</h2>
              <p className="text-sm text-muted-foreground">
                Record the result for each assigned issue from this session.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {assignments.map((row) => {
                const issueId = row.assignment.issueId;
                const draft = outcomeDrafts[issueId] ?? {
                  status: "" as const,
                  notes: "",
                  saved: false,
                  saving: false,
                  error: null,
                };

                return (
                  <Card key={issueId}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base leading-snug">{row.issue_summary}</CardTitle>
                      <p className="text-sm text-muted-foreground">{row.assignment.groupName}</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1.5">
                        <Label>Outcome</Label>
                        <Select
                          value={draft.status}
                          disabled={draft.saved}
                          onValueChange={(value) =>
                            setOutcomeDrafts((prev) => ({
                              ...prev,
                              [issueId]: {
                                ...draft,
                                status: value as OutcomeDraft["status"],
                                saved: false,
                              },
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select outcome" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="partial">Partially resolved</SelectItem>
                            <SelectItem value="escalated">Needs more work</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor={`notes-${issueId}`}>Notes</Label>
                        <Textarea
                          id={`notes-${issueId}`}
                          rows={3}
                          value={draft.notes}
                          disabled={draft.saved}
                          placeholder="What was completed? What remains?"
                          onChange={(e) =>
                            setOutcomeDrafts((prev) => ({
                              ...prev,
                              [issueId]: { ...draft, notes: e.target.value, saved: false },
                            }))
                          }
                        />
                      </div>

                      {draft.error ? <p className="text-xs text-destructive">{draft.error}</p> : null}

                      {draft.saved ? (
                        <p className="inline-flex items-center gap-1 text-sm text-primary">
                          <CheckCircle2Icon className="size-4" />
                          Outcome recorded
                        </p>
                      ) : (
                        <Button
                          className="h-11 w-full sm:w-auto"
                          disabled={draft.saving}
                          onClick={() => void saveOutcome(issueId)}
                        >
                          {draft.saving ? "Saving..." : "Save outcome"}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
