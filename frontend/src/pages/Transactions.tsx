import { type FormEvent, useEffect, useState } from "react";

import { PageHeader } from "../components/PageHeader";
import { RecommendationBadge, RiskBadge } from "../components/RiskBadge";
import { EmptyState, ErrorState, LoadingState } from "../components/StateBlock";
import {
  createTransaction,
  getGroups,
  getTransactions,
  getUsers,
  scoreTransaction,
} from "../services/api";
import type { GroupProfile, RiskScore, TransactionEvent, TransactionType, UserProfile } from "../types/api";

const transactionTypes: TransactionType[] = [
  "CONTRIBUTION",
  "FUNDING_REQUEST",
  "DISBURSEMENT",
  "REPAYMENT",
];

export function Transactions() {
  const [transactions, setTransactions] = useState<TransactionEvent[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [groups, setGroups] = useState<GroupProfile[]>([]);
  const [latestScore, setLatestScore] = useState<RiskScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  async function loadData() {
    try {
      const [loadedTransactions, loadedUsers, loadedGroups] = await Promise.all([
        getTransactions(),
        getUsers(),
        getGroups(),
      ]);
      setTransactions(loadedTransactions);
      setUsers(loadedUsers);
      setGroups(loadedGroups);
    } catch {
      setMessage("Unable to load transaction data. Confirm the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleCreateTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(event.currentTarget);
    const groupId = Number(form.get("group_id"));
    try {
      setMessage(null);
      await createTransaction({
        user_id: Number(form.get("user_id")),
        group_id: groupId || undefined,
        transaction_type: String(form.get("transaction_type")) as TransactionType,
        amount: String(form.get("amount")),
        currency: String(form.get("currency") || "USD"),
        status: "PENDING",
      });
      formElement.reset();
      setMessage("Transaction created successfully.");
      await loadData();
    } catch {
      setMessage("Unable to create transaction. Users and groups must exist first.");
    }
  }

  async function handleScore(transactionId: number) {
    try {
      setMessage(null);
      setLatestScore(await scoreTransaction(transactionId));
      await loadData();
    } catch {
      setLatestScore(null);
      setMessage("Unable to score transaction.");
    }
  }

  function userName(userId: number) {
    return users.find((user) => user.id === userId)?.full_name ?? `User #${userId}`;
  }

  function groupName(groupId?: number | null) {
    if (!groupId) {
      return "None";
    }
    return groups.find((group) => group.id === groupId)?.name ?? `Group #${groupId}`;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Transactions"
        description="Create transaction events, score them, and review deterministic risk explanations."
      />

      {message ? <ErrorState message={message} /> : null}

      <form
        data-testid="transaction-form"
        onSubmit={handleCreateTransaction}
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-3"
      >
        <select data-testid="transaction-user" className="rounded-xl border border-slate-200 px-3 py-2" name="user_id" required>
          <option value="">Select user</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.full_name}
            </option>
          ))}
        </select>
        <select data-testid="transaction-group" className="rounded-xl border border-slate-200 px-3 py-2" name="group_id">
          <option value="">No group</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
        <select data-testid="transaction-type" className="rounded-xl border border-slate-200 px-3 py-2" name="transaction_type">
          {transactionTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <input data-testid="transaction-amount" className="rounded-xl border border-slate-200 px-3 py-2" name="amount" placeholder="Amount" defaultValue="100.00" required />
        <input data-testid="transaction-currency" className="rounded-xl border border-slate-200 px-3 py-2" name="currency" placeholder="Currency" defaultValue="USD" maxLength={3} />
        <button data-testid="create-transaction-submit" className="rounded-xl bg-trust px-4 py-2 font-semibold text-white hover:bg-blue-700">
          Create Transaction
        </button>
      </form>

      {latestScore ? (
        <section data-testid="latest-score" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-bold text-ink">Latest Score</h3>
            <span className="text-2xl font-bold">{latestScore.score}</span>
            <RiskBadge level={latestScore.level} />
            <RecommendationBadge recommendation={latestScore.recommendation} />
          </div>
          <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-slate-600">
            {latestScore.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {loading ? <LoadingState label="Loading transactions..." /> : null}
      {!loading && !transactions.length ? <EmptyState message="No transactions created yet." /> : null}
      {transactions.length ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {["ID", "User", "Group", "Type", "Amount", "Status", "Actions"].map((heading) => (
                  <th key={heading} className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((transaction) => (
                <tr key={transaction.id} data-testid="transaction-row" data-transaction-id={transaction.id}>
                  <td className="px-5 py-4 font-medium text-ink">#{transaction.id}</td>
                  <td className="px-5 py-4 text-slate-600">{userName(transaction.user_id)}</td>
                  <td className="px-5 py-4 text-slate-600">{groupName(transaction.group_id)}</td>
                  <td className="px-5 py-4 text-slate-600">{transaction.transaction_type}</td>
                  <td className="px-5 py-4 text-slate-600">
                    {transaction.currency} {transaction.amount}
                  </td>
                  <td className="px-5 py-4 text-slate-600">{transaction.status}</td>
                  <td className="px-5 py-4">
                    <button data-testid="score-transaction" className="text-sm font-semibold text-trust" onClick={() => void handleScore(transaction.id)}>
                      Score
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
