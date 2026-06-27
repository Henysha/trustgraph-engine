import { RiskBadge } from "../components/RiskBadge";
import { StatCard } from "../components/StatCard";

export function Dashboard() {
  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-trust">
          Community Finance Risk
        </p>
        <h2 className="mt-3 text-4xl font-bold text-ink">TrustGraph Engine</h2>
        <p className="mt-4 max-w-3xl text-slate-600">
          Explainable fraud and reputation scoring for users, groups, and transaction events.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Risk Bands" value="0-100" caption="LOW, MEDIUM, and HIGH scoring tiers" />
        <StatCard label="Actions" value="3" caption="Approve, review, or block recommendations" />
        <StatCard label="Review Flow" value="Live" caption="High-risk events create alerts and cases" />
      </section>

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
