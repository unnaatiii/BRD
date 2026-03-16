import { getAllFeatures } from "@/lib/db";
import StatCard from "@/components/StatCard";
import FeatureTableNav from "@/components/FeatureTableNav";
import {
  FeaturesByMonthChart,
  FeaturesByVerticalChart,
  SuccessRateChart,
  UsageScoreChart,
} from "@/components/Charts";
import Link from "next/link";
import type { Feature } from "@/lib/types";

/** Week runs Monday–Saturday */
function getWeekRange() {
  const now = new Date();
  const start = new Date(now);
  const daysFromMonday = now.getDay() === 0 ? 6 : now.getDay() - 1;
  start.setDate(now.getDate() - daysFromMonday);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 5); // Saturday = Monday + 5
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export default async function DashboardPage() {
  const features = getAllFeatures();
  const { start: weekStart, end: weekEnd } = getWeekRange();
  const { start: monthStart, end: monthEnd } = getMonthRange();

  const releasedThisWeek = features.filter(
    (f) =>
      f.status === "Released" &&
      f.release_date &&
      f.release_date >= weekStart &&
      f.release_date <= weekEnd
  );
  const releasedThisMonth = features.filter(
    (f) =>
      f.status === "Released" &&
      f.release_date &&
      f.release_date >= monthStart &&
      f.release_date <= monthEnd
  );
  const scopeChanged = features.filter((f) => f.scope_changed_after_release);
  const scopeChangePct =
    features.length > 0 ? Math.round((scopeChanged.length / features.length) * 100) : 0;

  const released = features.filter((f) => f.status === "Released");
  const hotFixes = released.filter((f) => (f.release_type || "NORMAL_RELEASE") === "HOT_FIX");
  const hotFixPct = released.length > 0 ? Math.round((hotFixes.length / released.length) * 100) : 0;
  const withSuccessRate = features.filter((f) => f.success_rate != null);
  const avgSuccessRate =
    withSuccessRate.length > 0
      ? Math.round(
          withSuccessRate.reduce((s, f) => s + (f.success_rate ?? 0), 0) / withSuccessRate.length
        )
      : 0;

  const recentReleased = features
    .filter((f) => f.status === "Released" && f.release_date)
    .sort((a, b) => (b.release_date ?? "").localeCompare(a.release_date ?? ""))
    .slice(0, 5);

  const awaitingTesting = features.filter((f) => f.status === "Testing");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-600">Product feature and BRD tracking overview</p>
      </div>

      <div className="stat-card-list grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <StatCard
          title="Total Features"
          value={features.length}
          href="/features"
        />
        <StatCard
          title="Released This Week"
          value={releasedThisWeek.length}
          href={`/features?status=Released&start_date=${weekStart}&end_date=${weekEnd}`}
        />
        <StatCard
          title="Released This Month"
          value={releasedThisMonth.length}
          href={`/features?status=Released&start_date=${monthStart}&end_date=${monthEnd}`}
        />
        <StatCard
          title="Scope Change %"
          value={`${scopeChangePct}%`}
          href="/features?scope_change=true"
        />
        <StatCard
          title="Hot Fix %"
          value={`${hotFixPct}%`}
          href="/features?release_type=HOT_FIX"
        />
        <StatCard title="Avg Success Rate" value={`${avgSuccessRate}%`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Features Released per Month</h3>
          <FeaturesByMonthChart features={features} />
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Features by Vertical</h3>
          <FeaturesByVerticalChart features={features} />
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Success Rate by Vertical</h3>
          <SuccessRateChart features={features} />
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Usage Score by Vertical</h3>
          <UsageScoreChart features={features} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Recent Features Released</h3>
          <FeatureTableNav data={recentReleased} />
          <div className="mt-4">
            <Link
              href="/features"
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              View all features →
            </Link>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Features Awaiting Testing</h3>
          <FeatureTableNav data={awaitingTesting} variant="testing" />
          <div className="mt-4">
            <Link
              href="/features?status=Testing"
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              View all testing features →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
