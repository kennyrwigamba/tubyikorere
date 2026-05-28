import { Link } from "react-router-dom";
import { ShieldAlertIcon } from "lucide-react";

import { AuthPageShell } from "@/components/molecules/AuthPageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_DEFAULT_ROUTE } from "@/lib/role-routes";
import { useAppStore } from "@/store";

export default function UnauthorizedRoute() {
  const { isAuthenticated, role } = useAppStore();
  const homePath = role && isAuthenticated ? ROLE_DEFAULT_ROUTE[role] : "/login";

  return (
    <AuthPageShell title="Access denied" subtitle="You don't have permission to view this page.">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlertIcon className="size-4 text-muted-foreground" aria-hidden />
            Unauthorized
          </CardTitle>
          <CardDescription>
            This area is for a different role. Use the button below to return to your portal.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button asChild className="h-11 w-full">
            <Link to={homePath}>Go to my portal</Link>
          </Button>
          {!isAuthenticated ? (
            <Button asChild variant="outline" className="h-11 w-full">
              <Link to="/login">Sign in</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </AuthPageShell>
  );
}
