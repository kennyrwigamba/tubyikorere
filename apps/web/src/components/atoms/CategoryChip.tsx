import { Badge } from "@/components/ui/badge";

type CategoryChipProps = {
  category: string;
};

const LABELS: Record<string, string> = {
  infrastructure: "Infrastructure",
  water: "Water",
  health: "Health",
  education: "Education",
  environment: "Environment",
  safety: "Safety",
  other: "Other",
};

export function CategoryChip({ category }: CategoryChipProps) {
  return (
    <Badge variant="outline" className="capitalize">
      {LABELS[category] ?? category}
    </Badge>
  );
}
