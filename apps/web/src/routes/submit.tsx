import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const submitSchema = z.object({
  village_id: z.string().trim().min(1, "Village is required"),
  raw_text: z
    .string()
    .trim()
    .min(20, "Please provide at least 20 characters so we can understand the problem"),
  submitter_phone: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined))
    .refine(
      (value) => !value || /^\+?[1-9]\d{7,14}$/.test(value),
      "Enter a valid phone number",
    ),
});

type SubmitFormValues = z.infer<typeof submitSchema>;

type VillageOption = {
  id: string;
  label: string;
};

function toVillageOption(row: unknown): VillageOption | null {
  if (!row || typeof row !== "object") return null;
  const data = row as Record<string, unknown>;
  const id = typeof data.id === "string" ? data.id : "";
  if (!id) return null;

  const name =
    (typeof data.name === "string" && data.name) ||
    (typeof data.nameKinyarwanda === "string" && data.nameKinyarwanda) ||
    (typeof data.name_kinyarwanda === "string" && data.name_kinyarwanda) ||
    "Unknown village";

  return { id, label: name };
}

function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object"
  ) {
    const response = (error as { response?: { data?: { error?: string; message?: string } } })
      .response;
    if (response?.data?.error) return response.data.error;
    if (response?.data?.message) return response.data.message;
  }

  if (error instanceof Error) return error.message;
  return "Unable to submit your issue right now. Please try again.";
}

export default function SubmitRoute() {
  const [villages, setVillages] = useState<VillageOption[]>([]);
  const [villagesLoading, setVillagesLoading] = useState(true);
  const [villagesError, setVillagesError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedIssueId, setSubmittedIssueId] = useState<string | null>(null);

  const demoCellId = import.meta.env.VITE_DEMO_CELL_ID as string | undefined;

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SubmitFormValues>({
    defaultValues: {
      village_id: "",
      raw_text: "",
      submitter_phone: "",
    },
  });

  useEffect(() => {
    const loadVillages = async () => {
      if (!demoCellId) {
        setVillagesError("VITE_DEMO_CELL_ID is missing.");
        setVillagesLoading(false);
        return;
      }

      try {
        setVillagesLoading(true);
        setVillagesError(null);
        const response = await api.get("/api/villages", {
          params: { cell_id: demoCellId },
        });

        const rows = Array.isArray(response.data)
          ? response.data
          : Array.isArray((response.data as { villages?: unknown[] })?.villages)
            ? (response.data as { villages: unknown[] }).villages
            : [];

        const next = rows.map(toVillageOption).filter((v): v is VillageOption => Boolean(v));
        setVillages(next);
      } catch (error) {
        setVillagesError(getErrorMessage(error));
      } finally {
        setVillagesLoading(false);
      }
    };

    void loadVillages();
  }, [demoCellId]);

  const canSubmit = useMemo(
    () => !villagesLoading && !villagesError && villages.length > 0 && !isSubmitting,
    [villagesLoading, villagesError, villages.length, isSubmitting],
  );

  const onSubmit = async (values: SubmitFormValues) => {
    setSubmitError(null);
    setSubmittedIssueId(null);

    const parsed = submitSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      if (fieldErrors.village_id?.[0]) setError("village_id", { message: fieldErrors.village_id[0] });
      if (fieldErrors.raw_text?.[0]) setError("raw_text", { message: fieldErrors.raw_text[0] });
      if (fieldErrors.submitter_phone?.[0]) {
        setError("submitter_phone", { message: fieldErrors.submitter_phone[0] });
      }
      return;
    }

    if (!demoCellId) {
      setSubmitError("Submission is not configured: missing VITE_DEMO_CELL_ID.");
      return;
    }

    try {
      const response = await api.post("/api/issues", {
        raw_text: parsed.data.raw_text,
        village_id: parsed.data.village_id,
        cell_id: demoCellId,
        submitter_phone: parsed.data.submitter_phone,
        submission_channel: "web",
      });

      const issueId =
        typeof response.data?.id === "string"
          ? response.data.id
          : typeof response.data?.issue_id === "string"
            ? response.data.issue_id
            : null;
      setSubmittedIssueId(issueId);

      reset({
        village_id: "",
        raw_text: "",
        submitter_phone: "",
      });
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    }
  };

  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col justify-center px-4 py-8">
        <Card>
          <CardHeader>
            <p className="text-sm font-semibold text-primary">Tubikorere</p>
            <CardTitle>Submit an issue / Ohereza ikibazo</CardTitle>
            <CardDescription>
              Report a community problem quickly. / Menyesha ikibazo mu buryo bworoshye.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="village_id">Village / Umudugudu</Label>
                <Controller
                  control={control}
                  name="village_id"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={villagesLoading}>
                      <SelectTrigger id="village_id" aria-invalid={Boolean(errors.village_id)}>
                        <SelectValue
                          placeholder={
                            villagesLoading ? "Loading villages..." : "Select village / Hitamo umudugudu"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {villages.map((village) => (
                          <SelectItem key={village.id} value={village.id}>
                            {village.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.village_id ? (
                  <p className="text-xs text-destructive">{errors.village_id.message}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="raw_text">Describe the problem / Sobanura ikibazo</Label>
                <Textarea
                  id="raw_text"
                  rows={4}
                  placeholder="e.g. The road to the school floods when it rains / Urugendo rugana ku ishuri rukazwa n'amazi iyo imvura iganye"
                  {...register("raw_text")}
                  aria-invalid={Boolean(errors.raw_text)}
                  className="min-h-28"
                />
                {errors.raw_text ? (
                  <p className="text-xs text-destructive">{errors.raw_text.message}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="submitter_phone">
                  Your phone (optional) / Telephone yawe (ntibigomba)
                </Label>
                <Input
                  id="submitter_phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+2507..."
                  {...register("submitter_phone")}
                  aria-invalid={Boolean(errors.submitter_phone)}
                />
                <p className="text-xs text-muted-foreground">
                  We&apos;ll notify you when your issue is resolved / Tuzakumenyesha igihe ikibazo cyawe
                  gikemutse
                </p>
                {errors.submitter_phone ? (
                  <p className="text-xs text-destructive">{errors.submitter_phone.message}</p>
                ) : null}
              </div>

              {villagesError ? (
                <Alert variant="destructive">
                  <AlertCircleIcon className="size-4" />
                  <AlertTitle>Unable to load villages</AlertTitle>
                  <AlertDescription>{villagesError}</AlertDescription>
                </Alert>
              ) : null}

              {submitError ? (
                <Alert variant="destructive">
                  <AlertCircleIcon className="size-4" />
                  <AlertTitle>Submission failed</AlertTitle>
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              ) : null}

              {submittedIssueId ? (
                <Alert>
                  <CheckCircle2Icon className="size-4 text-primary" />
                  <AlertTitle>Issue received / Ikibazo cyakiriwe</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p>
                      Reference: <span className="font-mono font-semibold">{submittedIssueId.slice(0, 8).toUpperCase()}</span>.
                      The cell executive will review this issue. If you left your number, we will contact you.
                    </p>
                    <p className="text-muted-foreground">
                      Umuyobozi w&apos;akagari azacyigenzura. Nusize telefoni yawe, tuzakumenyesha.
                    </p>
                    <Button asChild variant="outline" size="sm" className="mt-1">
                      <Link to={`/track/${submittedIssueId}`}>Track status / Reba imiterere</Link>
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : null}

              <Button type="submit" className="h-11 w-full" disabled={!canSubmit}>
                {isSubmitting ? "Submitting..." : "Submit / Ohereza"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

