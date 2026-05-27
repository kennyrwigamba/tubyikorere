import { Navigate, Route, Routes } from "react-router-dom";
import { RootLayout } from "@/components/layouts/RootLayout";
import { ExecLayout } from "@/components/layouts/ExecLayout";
import { CoordinatorLayout } from "@/components/layouts/CoordinatorLayout";
import { SectorLayout } from "@/components/layouts/SectorLayout";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { ProtectedLayout } from "@/components/layouts/ProtectedLayout";
import LoginRoute from "@/routes/login";
import ChangePinRoute from "@/routes/change-pin";
import SubmitRoute from "@/routes/submit";
import DesignRoute from "@/routes/design";

function Placeholder() {
  return <div className="rounded-[var(--radius-lg)] border bg-card p-6">Layout preview placeholder</div>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/change-pin" element={<ChangePinRoute />} />
        <Route path="/submit" element={<SubmitRoute />} />
        <Route path="/design" element={<DesignRoute />} />

        <Route element={<ProtectedLayout allowedRoles={["cell_executive"]} />}>
          <Route path="/cell-executive" element={<ExecLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Placeholder />} />
            <Route path="issues" element={<Placeholder />} />
            <Route path="umuganda" element={<Placeholder />} />
            <Route path="reports" element={<Placeholder />} />
            <Route path="menu" element={<Placeholder />} />
          </Route>
        </Route>
        <Route element={<ProtectedLayout allowedRoles={["village_coordinator"]} />}>
          <Route path="/coordinator" element={<CoordinatorLayout />}>
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<Placeholder />} />
            <Route path="attendance" element={<Placeholder />} />
            <Route path="village" element={<Placeholder />} />
            <Route path="menu" element={<Placeholder />} />
          </Route>
        </Route>
        <Route element={<ProtectedLayout allowedRoles={["sector_official"]} />}>
          <Route path="/sector-official" element={<SectorLayout />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<Placeholder />} />
            <Route path="reports" element={<Placeholder />} />
            <Route path="map" element={<Placeholder />} />
            <Route path="menu" element={<Placeholder />} />
          </Route>
        </Route>
        <Route element={<ProtectedLayout allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Placeholder />} />
            <Route path="cells" element={<Placeholder />} />
            <Route path="users" element={<Placeholder />} />
            <Route path="settings" element={<Placeholder />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
