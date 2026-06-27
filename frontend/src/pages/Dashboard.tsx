import { useEffect, useState } from "react";

import { PageHeader } from "../components/PageHeader";
import { RiskBadge } from "../components/RiskBadge";
import { ErrorState, LoadingState } from "../components/StateBlock";
import { StatCard } from "../components/StatCard";
import { getAlerts, getGroups, getReviewCases, getTransactions, getUsers } from "../services/api";

interface DashboardStats {
  users: number;
  groups: number;
  transactions: number;
  openAlerts: number;
  openReviewCases: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        setError(null);
        const [users, groups, transactions, alerts, reviewCases] = await Promise.all([
          getUsers(),
          getGroups(),
          getTransactions(),
          getAlerts(),
          getReviewCases(),
        ]);
        setStats({
          users: users.length,
          groups: groups.length,
          transactions: transactions.length,
          openAlerts: alerts.filter((alert) => alert.status === "OPEN").length,
          openReviewCases: reviewCases.filter((reviewCase) => reviewCase.status === "OPEN").length,
        });
      } catch {
        setError("Unable to load dashboard metrics. Confirm the backend is running.");
      }
    }

    void loadStats();
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Community Finance Risk"
        title="TrustGraph Engine"
        description="Explainable fraud and reputation scoring for users, groups, and transaction events."
      />

      {error ? <ErrorState message={error} /> : null}
      {!stats && !error ? <LoadingState label="Loading dashboard metrics..." /> : null}

      {stats ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Total Users" value={String(stats.users)} caption="Profiles monitored" />
          <StatCard label="Total Groups" value={String(stats.groups)} caption="Finance groups" />
          <StatCard
            label="Transactions"
            value={String(stats.transactions)}
            caption="Events ingested"
          />
          <StatCard label="Open Alerts" value={String(stats.openAlerts)} caption="Fraud queue" />
          <StatCard
            label="Open Cases"
            value={String(stats.openReviewCases)}
            caption="Manual review"
          />
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-ink">Risk Model</h3>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4">
            <RiskBadge level="LOW" />
            <p className="mt-3 text-sm text-slate-600">0-30, auto-approve eligible.</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <RiskBadge level="MEDIUM" />
            <p className="mt-3 text-sm text-slate-600">31-70, send to manual review.</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <RiskBadge level="HIGH" />
            <p className="mt-3 text-sm text-slate-600">71-100, block and create a case.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
