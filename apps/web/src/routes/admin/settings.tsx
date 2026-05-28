import { useNavigate } from "react-router-dom";
import { LogOutIcon, ShieldCheckIcon } from "lucide-react";

import { PageHeader } from "@/components/molecules/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/store";

export default function AdminSettingsRoute() {
  const navigate = useNavigate();
  const { userName, entityName } = useAppStore();

  const handleLogout = () => {
    useAppStore.getState().logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <PageHeader title="Settings" description="Administrator account" />

      <div className="flex flex-col gap-6 px-4 pt-5 pb-8 lg:px-6 lg:pt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheckIcon className="size-4 text-muted-foreground" aria-hidden />
              System administrator
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Name
              </p>
              <p className="text-sm font-medium">{userName || "System Admin"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Organization
              </p>
              <p className="text-sm font-medium">{entityName || "Tubikorere Admin"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4 text-sm text-muted-foreground">
            Admin credentials are managed via server environment variables (
            <code className="text-xs">ADMIN_PHONE</code>, <code className="text-xs">ADMIN_PIN</code>
            ). Contact your platform operator to rotate credentials.
          </CardContent>
        </Card>

        <Separator />

        <Button
          variant="outline"
          className="h-11 w-full text-destructive hover:text-destructive sm:w-auto"
          onClick={handleLogout}
        >
          <LogOutIcon className="size-4" aria-hidden />
          Sign out
        </Button>
      </div>
    </>
  );
}
