import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Fragment } from "react";
import { useTheme } from "next-themes";
import { BellIcon, MoonIcon, SunIcon } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export type NavbarBreadcrumb = {
  label: string;
  href?: string;
};

export type AppNavbarProps = {
  /** Current page shown as the last breadcrumb segment */
  title: string;
  /** Optional trail before the current page, e.g. [{ label: "Tubikorere", href: "/" }] */
  breadcrumbs?: NavbarBreadcrumb[];
  /** Right-side actions — buttons, menus, etc. */
  actions?: ReactNode;
  /** Show theme toggle button */
  showThemeToggle?: boolean;
  /** Show notifications placeholder */
  showNotifications?: boolean;
  className?: string;
};

export function AppNavbar({
  title,
  breadcrumbs = [],
  actions,
  showThemeToggle = true,
  showNotifications = false,
  className,
}: AppNavbarProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-card/95 px-4 backdrop-blur-sm supports-[backdrop-filter]:bg-card/90 lg:px-6",
        className,
      )}
    >
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mx-1 h-4" />

      <Breadcrumb className="min-w-0 flex-1">
        <BreadcrumbList>
          {breadcrumbs.map((crumb) => (
            <Fragment key={crumb.label}>
              <BreadcrumbItem className="hidden sm:inline-flex">
                {crumb.href ? (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <span className="text-muted-foreground">{crumb.label}</span>
                )}
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden sm:inline-flex" />
            </Fragment>
          ))}
          <BreadcrumbItem>
            <BreadcrumbPage className="font-semibold">{title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        {showNotifications ? (
          <Button variant="ghost" size="icon-sm" aria-label="Notifications">
            <BellIcon />
          </Button>
        ) : null}

        {showThemeToggle ? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </Button>
        ) : null}

        {actions}
      </div>
    </header>
  );
}
