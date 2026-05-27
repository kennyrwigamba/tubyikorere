import { getCategoryConfig } from "@/lib/config/categories";
import type { IssueCategory } from "@/lib/constants";
import { cn } from "@/lib/utils";

type CategoryChipProps = {
  category: IssueCategory;
  className?: string;
};

export function CategoryChip({ category, className }: CategoryChipProps) {
  const config = getCategoryConfig(category);

  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center rounded-[var(--radius-sm)] border px-2 py-0.5 text-xs font-medium",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
