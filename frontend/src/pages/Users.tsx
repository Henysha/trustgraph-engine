import { type FormEvent, useEffect, useState } from "react";

import { PageHeader } from "../components/PageHeader";
import { RecommendationBadge, RiskBadge } from "../components/RiskBadge";
import { EmptyState, ErrorState, LoadingState } from "../components/StateBlock";
import { createUser, getApiErrorMessage, getUserRisk, getUsers } from "../services/api";
import type { RiskScore, UserProfile } from "../types/api";

export function Users() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [riskScore, setRiskScore] = useState<RiskScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  async function loadUsers() {
    try {
      setError(null);
      setUsers(await getUsers());
    } catch (caughtError) {
      setError(`Unable to load users: ${getApiErrorMessage(caughtError)}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(event.currentTarget);
    try {
      setActionMessage(null);
      await createUser({
        external_id: String(form.get("external_id")),
        full_name: String(form.get("full_name")),
        email: String(form.get("email") || ""),
        account_age_days: Number(form.get("account_age_days")),
        contribution_count: Number(form.get("contribution_count")),
        failed_transaction_count: Number(form.get("failed_transaction_count")),
        successful_repayment_count: Number(form.get("successful_repayment_count")),
        reputation_score: Number(form.get("reputation_score")),
      });
      formElement.reset();
      setActionMessage("User created successfully.");
      await loadUsers();
    } catch (caughtError) {
      setActionMessage(`Unable to create user: ${getApiErrorMessage(caughtError)}`);
    }
  }

  async function handleViewRisk(userId: number) {
    try {
      setActionMessage(null);
      setRiskScore(await getUserRisk(userId));
    } catch (caughtError) {
      setRiskScore(null);
      setActionMessage(`No risk score found for this user yet: ${getApiErrorMessage(caughtError)}`);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Users"
        description="Create and monitor user profiles with contribution, repayment, and reputation signals."
      />

      {error ? <ErrorState message={error} /> : null}
      {actionMessage ? <ErrorState message={actionMessage} /> : null}

      <form
        data-testid="user-form"
        onSubmit={handleCreateUser}
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-3"
      >
        <input data-testid="user-external-id" className="rounded-xl border border-slate-200 px-3 py-2" name="external_id" placeholder="External ID" required />
        <input data-testid="user-full-name" className="rounded-xl border border-slate-200 px-3 py-2" name="full_name" placeholder="Full name" required />
        <input data-testid="user-email" className="rounded-xl border border-slate-200 px-3 py-2" name="email" placeholder="Email" type="email" />
        <input data-testid="user-account-age" className="rounded-xl border border-slate-200 px-3 py-2" name="account_age_days" placeholder="Account age days" type="number" defaultValue={90} />
        <input data-testid="user-contributions" className="rounded-xl border border-slate-200 px-3 py-2" name="contribution_count" placeholder="Contributions" type="number" defaultValue={5} />
        <input data-testid="user-failed-transactions" className="rounded-xl border border-slate-200 px-3 py-2" name="failed_transaction_count" placeholder="Failed txns" type="number" defaultValue={0} />
        <input data-testid="user-successful-repayments" className="rounded-xl border border-slate-200 px-3 py-2" name="successful_repayment_count" placeholder="Successful repayments" type="number" defaultValue={0} />
        <input data-testid="user-reputation" className="rounded-xl border border-slate-200 px-3 py-2" name="reputation_score" placeholder="Reputation score" type="number" defaultValue={70} />
        <button data-testid="create-user-submit" className="rounded-xl bg-trust px-4 py-2 font-semibold text-white hover:bg-blue-700">
          Create User
        </button>
      </form>

      {riskScore ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-ink">Latest User Risk</h3>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-2xl font-bold">{riskScore.score}</span>
            <RiskBadge level={riskScore.level} />
            <RecommendationBadge recommendation={riskScore.recommendation} />
          </div>
        </section>
      ) : null}

      {loading ? <LoadingState label="Loading users..." /> : null}
      {!loading && !users.length ? <EmptyState message="No users created yet." /> : null}
      {users.length ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {["Name", "Reputation", "Contributions", "Failed Txns", "Actions"].map((heading) => (
                  <th key={heading} className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} data-testid="user-row">
                  <td className="px-5 py-4 font-medium text-ink">{user.full_name}</td>
                  <td className="px-5 py-4 text-slate-600">{user.reputation_score}</td>
                  <td className="px-5 py-4 text-slate-600">{user.contribution_count}</td>
                  <td className="px-5 py-4 text-slate-600">{user.failed_transaction_count}</td>
                  <td className="px-5 py-4">
                    <button className="text-sm font-semibold text-trust" onClick={() => void handleViewRisk(user.id)}>
                      View Risk
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
