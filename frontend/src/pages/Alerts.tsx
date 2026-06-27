import { useEffect, useState } from "react";

import { getAlerts } from "../services/api";
import type { FraudAlert } from "../types/api";

export function Alerts() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAlerts().then(setAlerts).catch(() => setError("Unable to load alerts yet."));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-ink">Fraud Alerts</h2>
        <p className="mt-2 text-slate-600">
          High-risk transactions are surfaced here for investigation.
        </p>
      </div>

      {error ? <p className="rounded-xl bg-amber-50 p-4 text-amber-700">{error}</p> : null}

      <div className="grid gap-4">
        {alerts.map((alert) => (
          <article key={alert.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-ink">Alert #{alert.id}</h3>
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                {alert.status}
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-600">{alert.reason}</p>
          </article>
        ))}
        {!alerts.length && !error ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-slate-500">
            No fraud alerts yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}
