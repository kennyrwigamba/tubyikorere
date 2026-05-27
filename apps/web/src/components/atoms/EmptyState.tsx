import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-[var(--radius-lg)] border bg-card p-6 text-center shadow-[var(--shadow-card)]">
      <Inbox className="mx-auto mb-3 size-10 text-muted-foreground" />
      <h3 className="mb-1 text-lg font-semibold">{title}</h3>
      <p className="mx-auto mb-4 max-w-md text-sm text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}
