import { Badge } from "@/components/ui/badge";
import { cn, getStatusConfig } from "@/lib/utils";

type StatusBadgeProps = {
  status: string;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = getStatusConfig(status);
  return <Badge className={cn("font-medium", cfg.className)}>{cfg.label}</Badge>;
}
