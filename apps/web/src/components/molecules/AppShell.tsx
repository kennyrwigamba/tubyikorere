import type { ReactNode } from "react";

import { AppNavbar, type AppNavbarProps } from "@/components/molecules/AppNavbar";
import { AppSidebar, type AppSidebarProps } from "@/components/molecules/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export type AppShellProps = {
  sidebar: AppSidebarProps;
  navbar?: AppNavbarProps;
  children: ReactNode;
  className?: string;
};

/** Portal shell — sidebar + main content area with optional navbar. */
export function AppShell({ sidebar, navbar, children, className }: AppShellProps) {
  return (
    <SidebarProvider className="min-h-svh bg-background">
      <AppSidebar {...sidebar} />
      <SidebarInset className={cn("min-w-0 bg-background", className)}>
        {navbar ? <AppNavbar {...navbar} /> : null}
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
