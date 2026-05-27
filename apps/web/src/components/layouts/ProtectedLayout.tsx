import { Navigate, Outlet } from "react-router-dom";
import type { Role } from "@/lib/constants";
import { ROLE_DEFAULT_ROUTE } from "@/lib/role-routes";
import { useAppStore } from "@/store";

type ProtectedLayoutProps = {
  allowedRoles: Role[];
};

export function ProtectedLayout({ allowedRoles }: ProtectedLayoutProps) {
  const { isAuthenticated, role, isFirstLogin } = useAppStore();

  if (!isAuthenticated || !role) return <Navigate to="/login" replace />;
  if (isFirstLogin && role !== "admin") return <Navigate to="/change-pin" replace />;
  if (!allowedRoles.includes(role)) return <Navigate to={ROLE_DEFAULT_ROUTE[role]} replace />;
  return <Outlet />;
}
