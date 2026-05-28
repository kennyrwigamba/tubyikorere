import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AuthPageShellProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
};

export function AuthPageShell({ title, subtitle, children, className }: AuthPageShellProps) {
  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center px-4 py-8 sm:px-6">
        {title || subtitle ? (
          <header className="mb-6">
            <p className="text-sm font-semibold text-primary">Tubyikorere</p>
            <p className="text-xs text-muted-foreground">Let&apos;s handle it together · Hamwe tuzabasha</p>
            {title ? <h1 className="mt-2 text-2xl font-bold tracking-tight">{title}</h1> : null}
            {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
          </header>
        ) : null}
        <div className={cn(className)}>{children}</div>
      </div>
    </main>
  );
}

