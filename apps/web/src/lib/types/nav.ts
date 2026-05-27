import type { LucideIcon } from "lucide-react";

export type SidebarNavItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: { title: string; url: string }[];
};

export type SidebarBrand = {
  name: string;
  subtitle: string;
  icon: LucideIcon;
};

export type SidebarUser = {
  name: string;
  email: string;
  avatar?: string;
};
