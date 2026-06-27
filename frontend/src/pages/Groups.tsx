import { type FormEvent, useEffect, useState } from "react";

import { PageHeader } from "../components/PageHeader";
import { RecommendationBadge, RiskBadge } from "../components/RiskBadge";
import { EmptyState, ErrorState, LoadingState } from "../components/StateBlock";
import { createGroup, getGroupRisk, getGroups } from "../services/api";
import type { GroupProfile, RiskScore } from "../types/api";

export function Groups() {
  const [groups, setGroups] = useState<GroupProfile[]>([]);
  const [riskScore, setRiskScore] = useState<RiskScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  async function loadGroups() {
    try {
      setGroups(await getGroups());
    } catch {
      setMessage("Unable to load groups. Confirm the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadGroups();
  }, []);

  async function handleCreateGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(event.currentTarget);
    try {
      setMessage(null);
      await createGroup({
        external_id: String(form.get("external_id")),
        name: String(form.get("name")),
        member_count: Number(form.get("member_count")),
        default_rate: String(form.get("default_rate")),
        suspicious_activity_count: Number(form.get("suspicious_activity_count")),
      });
      formElement.reset();
      setMessage("Group created successfully.");
      await loadGroups();
    } catch {
      setMessage("Unable to create group. Check required fields and unique external ID.");
    }
  }

  async function handleViewRisk(groupId: number) {
    try {
      setMessage(null);
      setRiskScore(await getGroupRisk(groupId));
    } catch {
      setRiskScore(null);
      setMessage("No risk score found for this group yet. Score a transaction first.");
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Groups"
        description="Manage community finance groups and monitor group-linked risk scores."
      />

      {message ? <ErrorState message={message} /> : null}

      <form
        data-testid="group-form"
        onSubmit={handleCreateGroup}
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-3"
      >
        <input data-testid="group-external-id" className="rounded-xl border border-slate-200 px-3 py-2" name="external_id" placeholder="External ID" required />
        <input data-testid="group-name" className="rounded-xl border border-slate-200 px-3 py-2" name="name" placeholder="Group name" required />
        <input data-testid="group-member-count" className="rounded-xl border border-slate-200 px-3 py-2" name="member_count" placeholder="Members" type="number" defaultValue={10} />
        <input data-testid="group-default-rate" className="rounded-xl border border-slate-200 px-3 py-2" name="default_rate" placeholder="Default rate, e.g. 0.0500" defaultValue="0.0500" />
        <input data-testid="group-suspicious-count" className="rounded-xl border border-slate-200 px-3 py-2" name="suspicious_activity_count" placeholder="Suspicious activity count" type="number" defaultValue={0} />
        <button data-testid="create-group-submit" className="rounded-xl bg-trust px-4 py-2 font-semibold text-white hover:bg-blue-700">
          Create Group
        </button>
      </form>

      {riskScore ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-ink">Latest Group Risk</h3>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-2xl font-bold">{riskScore.score}</span>
            <RiskBadge level={riskScore.level} />
            <RecommendationBadge recommendation={riskScore.recommendation} />
          </div>
        </section>
      ) : null}

      {loading ? <LoadingState label="Loading groups..." /> : null}
      {!loading && !groups.length ? <EmptyState message="No groups created yet." /> : null}
      {groups.length ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {["Name", "Members", "Default Rate", "Suspicious Events", "Actions"].map((heading) => (
                  <th key={heading} className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groups.map((group) => (
                <tr key={group.id} data-testid="group-row">
                  <td className="px-5 py-4 font-medium text-ink">{group.name}</td>
                  <td className="px-5 py-4 text-slate-600">{group.member_count}</td>
                  <td className="px-5 py-4 text-slate-600">{group.default_rate}</td>
                  <td className="px-5 py-4 text-slate-600">{group.suspicious_activity_count}</td>
                  <td className="px-5 py-4">
                    <button className="text-sm font-semibold text-trust" onClick={() => void handleViewRisk(group.id)}>
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
