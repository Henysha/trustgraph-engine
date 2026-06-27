import { useEffect, useState } from "react";

import { getUsers } from "../services/api";
import type { UserProfile } from "../types/api";

export function Users() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getUsers().then(setUsers).catch(() => setError("Unable to load users yet."));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-ink">Users</h2>
        <p className="mt-2 text-slate-600">Profiles that can receive trust signals and risk scores.</p>
      </div>

      {error ? <p className="rounded-xl bg-amber-50 p-4 text-amber-700">{error}</p> : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                Name
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                Reputation
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                Failed Txns
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-5 py-4 font-medium text-ink">{user.full_name}</td>
                <td className="px-5 py-4 text-slate-600">{user.reputation_score}</td>
                <td className="px-5 py-4 text-slate-600">{user.failed_transaction_count}</td>
              </tr>
            ))}
            {!users.length && !error ? (
              <tr>
                <td className="px-5 py-6 text-slate-500" colSpan={3}>
                  No users created yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
