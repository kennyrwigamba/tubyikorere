import { AlertTriangleIcon, CheckCircle2Icon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ReportDocumentProps = {
  reportText: string;
  keyAchievements: string[];
  escalations: string[];
  attendanceRate?: string | number;
  className?: string;
};

/** Formal sector report layout — document-style body with achievements and escalations. */
export function ReportDocument({
  reportText,
  keyAchievements,
  escalations,
  attendanceRate,
  className,
}: ReportDocumentProps) {
  const paragraphs = reportText
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  const rate =
    attendanceRate !== undefined && attendanceRate !== null && attendanceRate !== ""
      ? Number(attendanceRate)
      : null;

  return (
    <div className={cn("space-y-4", className)}>
      {rate !== null && Number.isFinite(rate) ? (
        <p className="text-sm text-muted-foreground">
          Attendance rate: <span className="font-medium text-foreground">{rate.toFixed(1)}%</span>
        </p>
      ) : null}

      <Card className="border-border/80 shadow-sm">
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle className="text-base font-semibold">Sector report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="text-sm leading-relaxed text-foreground/90">
              {paragraph}
            </p>
          ))}
        </CardContent>
      </Card>

      {keyAchievements.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2Icon className="size-4 text-[var(--color-brand-green)]" aria-hidden />
              Key achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-foreground/90">
              {keyAchievements.map((item, index) => (
                <li key={index} className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--color-brand-green)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {escalations.length > 0 ? (
        <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
          <AlertTriangleIcon />
          <AlertTitle>Escalations for sector follow-up</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1.5">
              {escalations.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
