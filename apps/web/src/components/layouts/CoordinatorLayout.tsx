import { PortalLayout, coordinatorItems } from "@/components/layouts/PortalLayout";

export function CoordinatorLayout() {
  return <PortalLayout title="Coordinator Portal" roleLabel="Village Coordinator" items={coordinatorItems} />;
}
