import { Navigate, Route, Routes } from "react-router-dom";
import { RootLayout } from "@/components/layouts/RootLayout";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { ExecLayout } from "@/components/layouts/ExecLayout";
import { CoordinatorLayout } from "@/components/layouts/CoordinatorLayout";
import { SectorLayout } from "@/components/layouts/SectorLayout";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { ProtectedLayout } from "@/components/layouts/ProtectedLayout";
import DesignRoute from "@/routes/design";

function Placeholder() {
  return <div className="rounded-[var(--radius-lg)] border bg-card p-6">Layout preview placeholder</div>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route element={<PublicLayout />}>
          <Route path="/design" element={<DesignRoute />} />
        </Route>

        <Route element={<ProtectedLayout allowedRoles={["cell_executive"]} />}>
          <Route path="/exec" element={<ExecLayout />}>
            <Route index element={<Placeholder />} />
          </Route>
        </Route>
        <Route element={<ProtectedLayout allowedRoles={["village_coordinator"]} />}>
          <Route path="/coordinator" element={<CoordinatorLayout />}>
            <Route index element={<Placeholder />} />
          </Route>
        </Route>
        <Route element={<ProtectedLayout allowedRoles={["sector_official"]} />}>
          <Route path="/sector" element={<SectorLayout />}>
            <Route index element={<Placeholder />} />
          </Route>
        </Route>
        <Route element={<ProtectedLayout allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Placeholder />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/design" replace />} />
    </Routes>
  );
}
