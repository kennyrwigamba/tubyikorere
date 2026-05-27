import { IssueCardList } from "@/components/molecules/IssueCard";
import { PageHeader } from "@/components/molecules/PageHeader";
import { AppShell } from "@/components/molecules/AppShell";
import { StatCard, StatCardGrid } from "@/components/molecules/StatCard";
import { Button } from "@/components/ui/button";
import {
  DEMO_EXEC_NAV,
  DEMO_SIDEBAR_BRAND,
  DEMO_SIDEBAR_USER,
} from "@/lib/demo-nav";
import { DEMO_ISSUES, DEMO_STATS } from "@/lib/demo-data";

export default function DesignRoute() {
  return (
    <AppShell
      sidebar={{
        brand: DEMO_SIDEBAR_BRAND,
        user: DEMO_SIDEBAR_USER,
        navItems: DEMO_EXEC_NAV,
        navLabel: "Cell Executive",
      }}
      navbar={{
        title: "Overview",
        breadcrumbs: [
          { label: "Tubikorere", href: "/design" },
          { label: "Kimironko Cell", href: "/design" },
        ],
        actions: <Button size="sm">Plan umuganda</Button>,
        showNotifications: true,
      }}
    >
      <PageHeader
        title="Kimironko Cell"
        description="Uwimana Jean Pierre · Cell Executive · Saturday 31 May 2026"
      />

      <div className="@container/main flex flex-1 flex-col gap-6 p-4 pt-6 lg:p-6">
        <StatCardGrid className="px-0 lg:px-0">
          <StatCard
            label="Open issues"
            value={DEMO_STATS.openIssues}
            trend={8.3}
            trendLabel="2 new since last week"
          />
          <StatCard
            label="Last umuganda attendance"
            value={`${DEMO_STATS.attendanceRate}%`}
            trend={4.2}
            trendLabel="Above sector average"
          />
          <StatCard
            label="Next umuganda"
            value={DEMO_STATS.nextUmuganda}
            footer="3 villages · 150 expected participants"
          />
          <StatCard
            label="Resolved this month"
            value={DEMO_STATS.resolvedThisMonth}
            trend={-5.0}
            trendLabel="Slower than April pace"
          />
        </StatCardGrid>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Priority issues</h2>
            <Button variant="ghost" size="sm">
              View all
            </Button>
          </div>
          <IssueCardList issues={DEMO_ISSUES.slice(0, 3)} />
        </section>
      </div>
    </AppShell>
  );
}
