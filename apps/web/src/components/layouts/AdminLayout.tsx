import { PortalLayout, adminItems } from "@/components/layouts/PortalLayout";

export function AdminLayout() {
  return <PortalLayout title="Admin Portal" roleLabel="System Administrator" items={adminItems} />;
}
