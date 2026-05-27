import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type LoadingSpinnerProps = {
  label?: string;
  className?: string;
};

export function LoadingSpinner({ label = "Loading...", className }: LoadingSpinnerProps) {
  return (
    <div className={cn("flex items-center justify-center gap-2 text-primary", className)}>
      <Loader2 className="size-5 animate-spin" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
