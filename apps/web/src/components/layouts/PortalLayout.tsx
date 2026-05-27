import type { LucideIcon } from "lucide-react";
import { Home, FileText, ListTodo, Menu, User, ShieldCheck, ClipboardCheck, Map, Settings, Users } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";

type PortalItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

type PortalLayoutProps = {
  title: string;
  roleLabel: string;
  items: PortalItem[];
};

export function PortalLayout({ title, roleLabel, items }: PortalLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <aside className="hidden w-60 flex-col border-r bg-card p-4 md:flex">
        <div className="mb-6">
          <p className="text-xs font-medium text-muted-foreground">Tubikorere</p>
          <p className="text-xl font-bold">{title}</p>
          <p className="text-sm text-muted-foreground">{roleLabel}</p>
        </div>
        <nav className="space-y-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-md border-l-2 border-transparent px-3 py-2 text-sm",
                  isActive
                    ? "border-l-primary bg-secondary text-secondary-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted"
                )
              }
            >
              <item.icon className="size-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="pb-20 md:pb-0 md:pl-60">
        <div className="mx-auto w-full max-w-6xl p-4 md:p-6">
          <Outlet />
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-card p-2 md:hidden">
        {items.slice(0, 5).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex min-h-11 flex-col items-center justify-center gap-1 rounded-md text-xs",
                isActive ? "text-primary font-medium" : "text-muted-foreground"
              )
            }
          >
            <item.icon className="size-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export const execItems: PortalItem[] = [
  { to: "/exec", label: "Home", icon: Home },
  { to: "/exec/issues", label: "Issues", icon: ListTodo },
  { to: "/exec/umuganda", label: "Umuganda", icon: ClipboardCheck },
  { to: "/exec/reports", label: "Reports", icon: FileText },
  { to: "/exec/menu", label: "Menu", icon: Menu },
];

export const coordinatorItems: PortalItem[] = [
  { to: "/coordinator", label: "Home", icon: Home },
  { to: "/coordinator/attendance", label: "Attendance", icon: ClipboardCheck },
  { to: "/coordinator/village", label: "My Village", icon: User },
  { to: "/coordinator/menu", label: "Menu", icon: Menu },
];

export const sectorItems: PortalItem[] = [
  { to: "/sector", label: "Overview", icon: Home },
  { to: "/sector/reports", label: "Reports", icon: FileText },
  { to: "/sector/map", label: "Map", icon: Map },
  { to: "/sector/menu", label: "Menu", icon: Menu },
];

export const adminItems: PortalItem[] = [
  { to: "/admin", label: "Dashboard", icon: ShieldCheck },
  { to: "/admin/cells", label: "Cells", icon: Home },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];
