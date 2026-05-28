import type { Role } from "@/lib/constants";

export const ROLE_DEFAULT_ROUTE: Record<Role, string> = {
  cell_executive: "/cell-executive/dashboard",
  village_coordinator: "/coordinator/home",
  sector_official: "/sector-official/overview",
  admin: "/admin/dashboard",
};

export const ROLE_SETTINGS_ROUTE: Record<Role, string> = {
  cell_executive: "/cell-executive/settings",
  village_coordinator: "/coordinator/settings",
  sector_official: "/sector-official/settings",
  admin: "/admin/settings",
};

