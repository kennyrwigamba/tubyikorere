import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  icon: LucideIcon;
  value: string;
  label: string;
  trend?: string;
  emphasis?: "positive" | "warning";
};

export function StatCard({ icon: Icon, value, label, trend, emphasis }: StatCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden",
        emphasis === "positive" && "border-l-4 border-l-[var(--color-brand-green)]",
        emphasis === "warning" && "border-l-4 border-l-[var(--color-brand-amber)]"
      )}
    >
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <Icon className="size-6 text-muted-foreground" />
          {trend ? <span className="text-xs font-medium text-muted-foreground">{trend}</span> : null}
        </div>
        <p className="text-4xl leading-none font-extrabold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
