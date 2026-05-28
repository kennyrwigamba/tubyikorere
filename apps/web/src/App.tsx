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
import CellExecutiveDashboardRoute from "@/routes/cell-executive/dashboard";
import CellExecutiveIssuesRoute from "@/routes/cell-executive/issues";
import CellExecutiveIssueDetailRoute from "@/routes/cell-executive/issue-detail";
import CellExecutiveUmugandaRoute from "@/routes/cell-executive/umuganda";
import CellExecutiveUmugandaPlanRoute from "@/routes/cell-executive/umuganda-plan";
import CellExecutiveUmugandaAttendanceRoute from "@/routes/cell-executive/umuganda-attendance";
import CellExecutiveReportSessionRoute from "@/routes/cell-executive/report-session";
import CellExecutiveReportsRoute from "@/routes/cell-executive/reports";
import CellExecutiveSettingsRoute from "@/routes/cell-executive/settings";
import CoordinatorHomeRoute from "@/routes/coordinator/home";
import CoordinatorAttendanceRoute from "@/routes/coordinator/attendance";
import CoordinatorVillageRoute from "@/routes/coordinator/village";
import CoordinatorSettingsRoute from "@/routes/coordinator/settings";
import SectorOverviewRoute from "@/routes/sector-official/overview";
import SectorReportsRoute from "@/routes/sector-official/reports";
import SectorReportDetailRoute from "@/routes/sector-official/report-detail";
import SectorEscalationsRoute from "@/routes/sector-official/escalations";
import SectorCellsRoute from "@/routes/sector-official/cells";
import SectorSettingsRoute from "@/routes/sector-official/settings";
import AdminDashboardRoute from "@/routes/admin/dashboard";
import AdminHierarchyRoute from "@/routes/admin/hierarchy";
import AdminUsersRoute from "@/routes/admin/users";
import AdminActivityRoute from "@/routes/admin/activity";
import AdminSettingsRoute from "@/routes/admin/settings";
import TrackIssueRoute from "@/routes/track";
import TrackLookupRoute from "@/routes/track-lookup";
import HomeRoute from "@/routes/home";
import UnauthorizedRoute from "@/routes/unauthorized";
import NotFoundRoute from "@/routes/not-found";

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/change-pin" element={<ChangePinRoute />} />
        <Route path="/submit" element={<SubmitRoute />} />
        <Route path="/track" element={<TrackLookupRoute />} />
        <Route path="/track/:issueId" element={<TrackIssueRoute />} />
        <Route path="/unauthorized" element={<UnauthorizedRoute />} />
        <Route path="/design" element={<DesignRoute />} />

        <Route element={<ProtectedLayout allowedRoles={["cell_executive"]} />}>
          <Route path="/cell-executive" element={<ExecLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<CellExecutiveDashboardRoute />} />
            <Route path="issues" element={<CellExecutiveIssuesRoute />} />
            <Route path="issues/:id" element={<CellExecutiveIssueDetailRoute />} />
            <Route path="umuganda" element={<CellExecutiveUmugandaRoute />} />
            <Route path="umuganda/:id/plan" element={<CellExecutiveUmugandaPlanRoute />} />
            <Route path="umuganda/:id/attendance" element={<CellExecutiveUmugandaAttendanceRoute />} />
            <Route path="reports" element={<CellExecutiveReportsRoute />} />
            <Route path="reports/:sessionId" element={<CellExecutiveReportSessionRoute />} />
            <Route path="settings" element={<CellExecutiveSettingsRoute />} />
            <Route path="menu" element={<Navigate to="settings" replace />} />
          </Route>
        </Route>
        <Route element={<ProtectedLayout allowedRoles={["village_coordinator"]} />}>
          <Route path="/coordinator" element={<CoordinatorLayout />}>
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<CoordinatorHomeRoute />} />
            <Route path="attendance" element={<CoordinatorAttendanceRoute />} />
            <Route path="village" element={<CoordinatorVillageRoute />} />
            <Route path="settings" element={<CoordinatorSettingsRoute />} />
            <Route path="menu" element={<Navigate to="settings" replace />} />
          </Route>
        </Route>
        <Route element={<ProtectedLayout allowedRoles={["sector_official"]} />}>
          <Route path="/sector-official" element={<SectorLayout />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<SectorOverviewRoute />} />
            <Route path="reports" element={<SectorReportsRoute />} />
            <Route path="reports/:reportId" element={<SectorReportDetailRoute />} />
            <Route path="escalations" element={<SectorEscalationsRoute />} />
            <Route path="cells" element={<SectorCellsRoute />} />
            <Route path="settings" element={<SectorSettingsRoute />} />
            <Route path="map" element={<Navigate to="overview" replace />} />
            <Route path="menu" element={<Navigate to="settings" replace />} />
          </Route>
        </Route>
        <Route element={<ProtectedLayout allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardRoute />} />
            <Route path="hierarchy" element={<AdminHierarchyRoute />} />
            <Route path="users" element={<AdminUsersRoute />} />
            <Route path="activity" element={<AdminActivityRoute />} />
            <Route path="settings" element={<AdminSettingsRoute />} />
            <Route path="cells" element={<Navigate to="hierarchy" replace />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundRoute />} />
    </Routes>
  );
}
