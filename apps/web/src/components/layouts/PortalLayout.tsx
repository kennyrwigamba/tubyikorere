import type { LucideIcon } from "lucide-react";
import {
  ActivityIcon,
  AlertTriangleIcon,
  Building2Icon,
  ClipboardCheck,
  FileText,
  GitBranchIcon,
  Home,
  ListTodo,
  MapPinIcon,
  Settings,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { Outlet, useLocation } from "react-router-dom";

import { AppShell } from "@/components/molecules/AppShell";
import type { SidebarNavItem } from "@/lib/types/nav";
import { useAppStore } from "@/store";

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

function toNavItems(items: PortalItem[], pathname: string): SidebarNavItem[] {
  return items.map((item) => ({
    title: item.label,
    url: item.to,
    icon: item.icon,
    isActive: pathname === item.to || pathname.startsWith(`${item.to}/`),
  }));
}

function getPageTitle(items: PortalItem[], pathname: string, fallback: string) {
  const match = items.find(
    (item) => pathname === item.to || pathname.startsWith(`${item.to}/`),
  );
  return match?.label ?? fallback;
}

export function PortalLayout({ title, roleLabel, items }: PortalLayoutProps) {
  const { pathname } = useLocation();
  const { userName, entityName } = useAppStore();

  const navItems = toNavItems(items, pathname);
  const pageTitle = getPageTitle(items, pathname, title);

  return (
    <AppShell
      sidebar={{
        brand: {
          name: entityName || title,
          subtitle: roleLabel,
          icon: MapPinIcon,
        },
        user: {
          name: userName || roleLabel,
          email: title,
        },
        navItems,
        navLabel: title,
      }}
      navbar={{
        title: pageTitle,
        breadcrumbs: [{ label: "Tubikorere" }],
        showNotifications: true,
      }}
    >
      <div className="@container/main flex flex-1 flex-col">
        <Outlet />
      </div>
    </AppShell>
  );
}

export const execItems: PortalItem[] = [
  { to: "/cell-executive/dashboard", label: "Home", icon: Home },
  { to: "/cell-executive/issues", label: "Issues", icon: ListTodo },
  { to: "/cell-executive/umuganda", label: "Umuganda", icon: ClipboardCheck },
  { to: "/cell-executive/reports", label: "Reports", icon: FileText },
  { to: "/cell-executive/settings", label: "Settings", icon: Settings },
];

export const coordinatorItems: PortalItem[] = [
  { to: "/coordinator/home", label: "Home", icon: Home },
  { to: "/coordinator/attendance", label: "Attendance", icon: ClipboardCheck },
  { to: "/coordinator/village", label: "My Village", icon: User },
  { to: "/coordinator/settings", label: "Settings", icon: Settings },
];

export const sectorItems: PortalItem[] = [
  { to: "/sector-official/overview", label: "Overview", icon: Home },
  { to: "/sector-official/reports", label: "Reports", icon: FileText },
  { to: "/sector-official/escalations", label: "Escalations", icon: AlertTriangleIcon },
  { to: "/sector-official/cells", label: "Cells", icon: Building2Icon },
  { to: "/sector-official/settings", label: "Settings", icon: Settings },
];

export const adminItems: PortalItem[] = [
  { to: "/admin/dashboard", label: "Dashboard", icon: ShieldCheck },
  { to: "/admin/hierarchy", label: "Hierarchy", icon: GitBranchIcon },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/activity", label: "Activity", icon: ActivityIcon },
];
