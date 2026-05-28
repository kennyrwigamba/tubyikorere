import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangleIcon } from "lucide-react";

import { LoadingSpinner } from "@/components/atoms/LoadingSpinner";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchAdminUsers } from "@/lib/api/admin";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { Role } from "@/lib/constants";

const ROLE_LABELS: Record<Role, string> = {
  cell_executive: "Cell executive",
  village_coordinator: "Village coordinator",
  sector_official: "Sector official",
  admin: "System admin",
};

export default function AdminUsersRoute() {
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["admin-users", roleFilter],
    queryFn: () => fetchAdminUsers(roleFilter),
  });

  if (isLoading) {
    return <LoadingSpinner label="Loading users..." fullPage />;
  }

  return (
    <>
      <PageHeader
        title="Users"
        description="All portal users across cells, villages, and sectors"
      />

      <div className="flex flex-col gap-4 px-4 pt-5 pb-6 lg:px-6 lg:pt-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <Label>Filter by role</Label>
            <Select
              value={roleFilter}
              onValueChange={(value) => setRoleFilter(value as Role | "all")}
            >
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="cell_executive">Cell executive</SelectItem>
                <SelectItem value="village_coordinator">Village coordinator</SelectItem>
                <SelectItem value="sector_official">Sector official</SelectItem>
                <SelectItem value="admin">System admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">{data.length} users</p>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertTriangleIcon className="size-4" />
            <AlertTitle>Failed to load users</AlertTitle>
            <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
          </Alert>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((user) => (
                  <TableRow key={`${user.role}-${user.id}`}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{ROLE_LABELS[user.role]}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[240px] truncate">{user.entity_name}</TableCell>
                    <TableCell>{user.phone || "—"}</TableCell>
                    <TableCell>
                      <Badge className="bg-[var(--color-brand-green)]/15 text-[var(--color-brand-green)]">
                        {user.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  );
}
