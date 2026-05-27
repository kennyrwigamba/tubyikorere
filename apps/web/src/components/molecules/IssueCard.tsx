import { ChevronRight, TriangleAlert } from "lucide-react";
import { CategoryChip } from "@/components/atoms/CategoryChip";
import { ChannelIcon } from "@/components/atoms/ChannelIcon";
import { SeverityBadge } from "@/components/atoms/SeverityBadge";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatTimeAgo, getSeverityConfig } from "@/lib/utils";

type IssueCardProps = {
  severity: number;
  category: string;
  status: string;
  summary: string;
  villageName: string;
  channel: "web" | "whatsapp";
  createdAt: string | Date;
  requiresEscalation?: boolean;
};

export function IssueCard(props: IssueCardProps) {
  const cfg = getSeverityConfig(props.severity);

  return (
    <Card className="transition-all duration-150 hover:translate-y-[-2px] hover:shadow-[var(--shadow-sm)] active:scale-[0.99]">
      <CardContent className="p-0">
        <div className="flex">
          <div className={cn("w-1.5 shrink-0 rounded-l-[var(--radius-lg)]", cfg.dotClass)} />
          <div className="flex-1 p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <SeverityBadge severity={props.severity} size="sm" />
              <CategoryChip category={props.category} />
              <StatusBadge status={props.status} />
            </div>
            <p className="line-clamp-2 text-base font-semibold">{props.summary}</p>
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <span>{props.villageName}</span>
              <ChannelIcon channel={props.channel} />
              <span>{formatTimeAgo(props.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center pr-3 text-muted-foreground">
            <ChevronRight className="size-4" />
          </div>
        </div>
        {props.requiresEscalation ? (
          <div className="flex items-center gap-1 border-t border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-800">
            <TriangleAlert className="size-3" />
            <span>Flagged for sector escalation</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
