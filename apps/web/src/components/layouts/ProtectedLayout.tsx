import { Navigate, Outlet } from "react-router-dom";
import type { Role } from "@/lib/constants";
import { useAppStore } from "@/store";

type ProtectedLayoutProps = {
  allowedRoles: Role[];
};

const roleHome: Record<Role, string> = {
  cell_executive: "/exec",
  village_coordinator: "/coordinator",
  sector_official: "/sector",
  admin: "/admin",
};

export function ProtectedLayout({ allowedRoles }: ProtectedLayoutProps) {
  const { isAuthenticated, role } = useAppStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(role)) return <Navigate to={roleHome[role]} replace />;
  return <Outlet />;
}
