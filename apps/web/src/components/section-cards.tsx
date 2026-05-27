import { StatCard, StatCardGrid } from "@/components/molecules/StatCard";

/** @deprecated Use StatCard + StatCardGrid with your own data instead. */
export function SectionCards() {
  return (
    <StatCardGrid>
      <StatCard
        label="Total Revenue"
        value="$1,250.00"
        trend={12.5}
        trendLabel="Trending up this month"
        footer="Visitors for the last 6 months"
      />
      <StatCard
        label="New Customers"
        value="1,234"
        trend={-20}
        trendLabel="Down 20% this period"
        footer="Acquisition needs attention"
      />
      <StatCard
        label="Active Accounts"
        value="45,678"
        trend={12.5}
        trendLabel="Strong user retention"
        footer="Engagement exceed targets"
      />
      <StatCard
        label="Growth Rate"
        value="4.5%"
        trend={4.5}
        trendLabel="Steady performance increase"
        footer="Meets growth projections"
      />
    </StatCardGrid>
  );
}
