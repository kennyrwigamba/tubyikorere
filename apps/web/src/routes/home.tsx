import { Navigate } from "react-router-dom";

import { ROLE_DEFAULT_ROUTE } from "@/lib/role-routes";
import { useAppStore } from "@/store";

export default function HomeRoute() {
  const { isAuthenticated, role } = useAppStore();

  if (isAuthenticated && role) {
    return <Navigate to={ROLE_DEFAULT_ROUTE[role]} replace />;
  }

  return <Navigate to="/login" replace />;
}
