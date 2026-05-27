import { Clock3, Hammer } from "lucide-react";
import { SeverityBadge } from "@/components/atoms/SeverityBadge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AssignmentGroupProps = {
  group: string;
  participants: number;
  issueSummary: string;
  severity: number;
  taskDescription: string;
  estimatedHours: number;
  materials: string;
  partial?: boolean;
};

export function AssignmentGroup({
  group,
  participants,
  issueSummary,
  severity,
  taskDescription,
  estimatedHours,
  materials,
  partial,
}: AssignmentGroupProps) {
  return (
    <Card className={partial ? "border-l-4 border-l-amber-500" : "border-l-4 border-l-primary"}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary text-xl font-extrabold text-primary-foreground">
            {group}
          </div>
          <div className="flex-1">
            <CardTitle>Group {group}</CardTitle>
            <Badge variant="outline" className="mt-1">
              {participants} participants
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <SeverityBadge severity={severity} size="sm" />
          <p className="text-sm font-semibold">{issueSummary}</p>
        </div>
        <p className="text-sm text-muted-foreground">{taskDescription}</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="gap-1">
            <Clock3 className="size-3" /> {estimatedHours} hours
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Hammer className="size-3" /> {materials}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
