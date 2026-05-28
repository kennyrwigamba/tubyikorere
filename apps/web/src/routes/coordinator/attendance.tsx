import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangleIcon, ArrowLeftIcon, CheckCircle2Icon } from "lucide-react";

import { LoadingSpinner } from "@/components/atoms/LoadingSpinner";
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
import { Textarea } from "@/components/ui/textarea";
import {
  saveVillageAttendance,
  saveWorkCompletion,
} from "@/lib/api/attendance";
import { fetchCoordinatorAttendance } from "@/lib/api/coordinator";
import { getApiErrorMessage } from "@/lib/api/errors";
import { formatDate, formatTimeAgo } from "@/lib/utils";
import { useAppStore } from "@/store";

function parseCount(value: string): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) return null;
  return n;
}

export default function CoordinatorAttendanceRoute() {
  const queryClient = useQueryClient();
  const { userId, userName, entityName } = useAppStore();
  const [attendanceEdit, setAttendanceEdit] = useState<{
    attended: string;
    absent: string;
  } | null>(null);
  const [attendanceSaving, setAttendanceSaving] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);

  const [outcomeEdit, setOutcomeEdit] = useState<{
    status: "resolved" | "partial" | "escalated";
    notes: string;
  } | null>(null);
  const [outcomeSaving, setOutcomeSaving] = useState(false);
  const [outcomeError, setOutcomeError] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["coordinator-attendance", userId],
    queryFn: () => fetchCoordinatorAttendance(userId),
    enabled: Boolean(userId),
  });

  const session = data?.session;
  const assignment = data?.assignment;
  const serverAttendance = data?.attendance;
  const serverCompletion = data?.completion?.completion;

  const attended = attendanceEdit?.attended ?? (serverAttendance ? String(serverAttendance.attended) : "");
  const absent = attendanceEdit?.absent ?? (serverAttendance ? String(serverAttendance.absent) : "");
  const attendanceSaved = Boolean(serverAttendance) && attendanceEdit === null;

  const outcomeStatus: "" | "resolved" | "partial" | "escalated" =
    outcomeEdit?.status ?? serverCompletion?.completionStatus ?? "";
  const outcomeNotes = outcomeEdit?.notes ?? serverCompletion?.completionNotes ?? "";
  const outcomeSaved = Boolean(serverCompletion) && outcomeEdit === null;

  const runningTotal = useMemo(() => {
    const a = parseCount(attended);
    return a ?? 0;
  }, [attended]);

  const saveAttendance = async () => {
    if (!session || !userId) return;
    const attendedCount = parseCount(attended);
    const absentCount = parseCount(absent);
    if (attendedCount === null || absentCount === null) {
      setAttendanceError("Enter whole numbers for attended and absent.");
      return;
    }

    setAttendanceSaving(true);
    setAttendanceError(null);
    try {
      await saveVillageAttendance({
        session_id: session.id,
        village_id: userId,
        village_name: entityName,
        attended: attendedCount,
        absent: absentCount,
        recorded_by: userName || "Village Coordinator",
      });
      setAttendanceEdit(null);
      void queryClient.invalidateQueries({ queryKey: ["coordinator-attendance", userId] });
    } catch (err) {
      setAttendanceError(getApiErrorMessage(err, "Save failed."));
    } finally {
      setAttendanceSaving(false);
    }
  };

  const saveOutcome = async () => {
    if (!session || !assignment) return;
    if (outcomeStatus === "") {
      setOutcomeError("Select an outcome.");
      return;
    }
    if (outcomeNotes.trim().length < 5) {
      setOutcomeError("Add a short note (at least 5 characters).");
      return;
    }

    setOutcomeSaving(true);
    setOutcomeError(null);
    try {
      await saveWorkCompletion({
        session_id: session.id,
        issue_id: assignment.assignment.issueId,
        completion_status: outcomeStatus,
        completion_notes: outcomeNotes.trim(),
      });
      setOutcomeEdit(null);
      void queryClient.invalidateQueries({ queryKey: ["coordinator-attendance", userId] });
    } catch (err) {
      setOutcomeError(getApiErrorMessage(err, "Save failed."));
    } finally {
      setOutcomeSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner label="Loading attendance..." fullPage />;
  }

  return (
    <>
      <PageHeader
        title="Record attendance"
        description={
          session
            ? formatDate(session.sessionDate, "EEEE, d MMMM yyyy")
            : `${entityName} · umuganda day`
        }
      />

      <div className="flex flex-col gap-6 px-4 pt-5 pb-8 lg:px-6 lg:pt-6">
        <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
          <Link to="/coordinator/home">
            <ArrowLeftIcon className="size-4" aria-hidden />
            Back to home
          </Link>
        </Button>

        {error ? (
          <Alert variant="destructive">
            <AlertTriangleIcon className="size-4" />
            <AlertTitle>Failed to load</AlertTitle>
            <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
          </Alert>
        ) : null}

        {!session ? (
          <Alert>
            <AlertTitle>No session to record</AlertTitle>
            <AlertDescription>
              There is no active or upcoming umuganda session yet. Check back when the cell
              executive schedules one.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">{entityName}</CardTitle>
                <p className="text-sm text-muted-foreground">Your village only</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="attended" className="text-base">
                      Attended
                    </Label>
                    <Input
                      id="attended"
                      type="number"
                      min={0}
                      inputMode="numeric"
                      className="h-14 text-lg"
                      value={attended}
                      disabled={attendanceSaved}
                      onChange={(e) => {
                        setAttendanceEdit({
                          attended: e.target.value,
                          absent,
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="absent" className="text-base">
                      Absent
                    </Label>
                    <Input
                      id="absent"
                      type="number"
                      min={0}
                      inputMode="numeric"
                      className="h-14 text-lg"
                      value={absent}
                      disabled={attendanceSaved}
                      onChange={(e) => {
                        setAttendanceEdit({
                          attended,
                          absent: e.target.value,
                        });
                      }}
                    />
                  </div>
                </div>

                <p className="text-sm font-medium tabular-nums">
                  Total attended: {runningTotal}
                </p>

                {attendanceError ? (
                  <p className="text-sm text-destructive">{attendanceError}</p>
                ) : null}

                {attendanceSaved ? (
                  <p className="inline-flex items-center gap-2 text-sm text-primary">
                    <CheckCircle2Icon className="size-4" aria-hidden />
                    Attendance saved
                    {serverAttendance?.recordedAt
                      ? ` · ${formatTimeAgo(serverAttendance.recordedAt)}`
                      : null}
                  </p>
                ) : (
                  <Button
                    className="h-12 w-full text-base"
                    disabled={attendanceSaving}
                    onClick={() => void saveAttendance()}
                  >
                    {attendanceSaving ? "Saving…" : "Save attendance"}
                  </Button>
                )}
              </CardContent>
            </Card>

            {attendanceSaved && assignment ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Work outcome</CardTitle>
                  <p className="text-sm text-muted-foreground">{assignment.issue_summary}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Outcome</Label>
                    <Select
                      value={outcomeStatus || undefined}
                      disabled={outcomeSaved}
                      onValueChange={(v) => {
                        setOutcomeEdit({
                          status: v as "resolved" | "partial" | "escalated",
                          notes: outcomeNotes,
                        });
                      }}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select outcome" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="partial">Partially resolved</SelectItem>
                        <SelectItem value="escalated">Needs more work</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="outcome-notes">Notes</Label>
                    <Textarea
                      id="outcome-notes"
                      rows={4}
                      disabled={outcomeSaved}
                      value={outcomeNotes}
                      placeholder="What was completed? What remains?"
                      onChange={(e) => {
                        if (!outcomeStatus) return;
                        setOutcomeEdit({
                          status: outcomeStatus as "resolved" | "partial" | "escalated",
                          notes: e.target.value,
                        });
                      }}
                    />
                  </div>

                  {outcomeError ? (
                    <p className="text-sm text-destructive">{outcomeError}</p>
                  ) : null}

                  {outcomeSaved ? (
                    <p className="inline-flex items-center gap-2 text-sm text-primary">
                      <CheckCircle2Icon className="size-4" aria-hidden />
                      Outcome recorded
                    </p>
                  ) : (
                    <Button
                      className="h-12 w-full text-base"
                      disabled={outcomeSaving}
                      onClick={() => void saveOutcome()}
                    >
                      {outcomeSaving ? "Saving…" : "Save outcome"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : attendanceSaved && !assignment ? (
              <Alert>
                <AlertTitle>No work assigned</AlertTitle>
                <AlertDescription>
                  Your village has no issue assigned for this session — attendance is all you
                  need to record.
                </AlertDescription>
              </Alert>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
