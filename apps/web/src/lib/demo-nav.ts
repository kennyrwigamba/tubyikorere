import {
  CalendarDaysIcon,
  ClipboardListIcon,
  LayoutDashboardIcon,
  MapPinIcon,
} from "lucide-react";

import type { SidebarBrand, SidebarNavItem, SidebarUser } from "@/lib/types/nav";

export const DEMO_SIDEBAR_BRAND: SidebarBrand = {
  name: "Bibare",
  subtitle: "Gasabo · Kigali",
  icon: MapPinIcon,
};

export const DEMO_SIDEBAR_USER: SidebarUser = {
  name: "Uwimana Jean Pierre",
  email: "Cell Executive",
  avatar: undefined,
};

export const DEMO_EXEC_NAV: SidebarNavItem[] = [
  {
    title: "Overview",
    url: "/design",
    icon: LayoutDashboardIcon,
    isActive: true,
  },
  {
    title: "Issues",
    url: "/design",
    icon: ClipboardListIcon,
    items: [
      { title: "Open", url: "/design" },
      { title: "Assigned", url: "/design" },
      { title: "Resolved", url: "/design" },
    ],
  },
  {
    title: "Umuganda",
    url: "/design",
    icon: CalendarDaysIcon,
    items: [
      { title: "Plan session", url: "/design" },
      { title: "Attendance", url: "/design" },
      { title: "History", url: "/design" },
    ],
  },
];
