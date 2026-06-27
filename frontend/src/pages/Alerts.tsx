import { useEffect, useState } from "react";

import { PageHeader } from "../components/PageHeader";
import { SeverityBadge, StatusBadge } from "../components/RiskBadge";
import { EmptyState, ErrorState, LoadingState } from "../components/StateBlock";
import { getAlerts, resolveAlert } from "../services/api";
import type { FraudAlert } from "../types/api";

export function Alerts() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadAlerts() {
    try {
      setError(null);
      setAlerts(await getAlerts());
    } catch {
      setError("Unable to load alerts. Confirm the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAlerts();
  }, []);

  async function handleResolve(alertId: number) {
    const analystNote = window.prompt("Resolution note", "Resolved during analyst review.");
    if (!analystNote) {
      return;
    }
    try {
      await resolveAlert(alertId, analystNote);
      await loadAlerts();
    } catch {
      setError("Unable to resolve alert.");
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Fraud Alerts"
        description="Investigate high-risk events and close alerts once reviewed."
      />

      {error ? <ErrorState message={error} /> : null}
      {loading ? <LoadingState label="Loading fraud alerts..." /> : null}
      {!loading && !alerts.length ? <EmptyState message="No fraud alerts yet." /> : null}

      {alerts.length ? (
        <div className="grid gap-4">
          {alerts.map((alert) => (
            <article key={alert.id} data-testid="alert-card" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-ink">Alert #{alert.id}</h3>
                  <p className="mt-1 text-sm text-slate-500">Transaction #{alert.transaction_id}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <SeverityBadge severity={alert.severity} />
                  <StatusBadge status={alert.status} />
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-600">{alert.reason}</p>
              {alert.status === "OPEN" ? (
                <button data-testid="resolve-alert" className="mt-4 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white" onClick={() => void handleResolve(alert.id)}>
                  Resolve Alert
                </button>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
