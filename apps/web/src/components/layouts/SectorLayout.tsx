import { PortalLayout, sectorItems } from "@/components/layouts/PortalLayout";

export function SectorLayout() {
  return <PortalLayout title="Sector Portal" roleLabel="Sector Official" items={sectorItems} />;
}
