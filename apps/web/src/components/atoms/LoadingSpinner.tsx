import type { ReactNode } from "react";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type LoadingSpinnerProps = {
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  fullPage?: boolean;
};

const sizeClasses = {
  sm: "size-4",
  md: "size-6",
  lg: "size-8",
} as const;

export function LoadingSpinner({
  label = "Loading",
  className,
  size = "md",
  fullPage = false,
}: LoadingSpinnerProps) {
  const content: ReactNode = (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-muted-foreground",
        className,
      )}
    >
      <Spinner className={cn(sizeClasses[size], "text-primary")} />
      {label ? <p className="text-sm">{label}</p> : null}
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center p-6">
        {content}
      </div>
    );
  }

  return content;
}
