import { useEffect, useState } from "react";

import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/RiskBadge";
import { EmptyState, ErrorState, LoadingState } from "../components/StateBlock";
import { approveReviewCase, getReviewCases, rejectReviewCase } from "../services/api";
import type { ReviewCase } from "../types/api";

export function ReviewCases() {
  const [reviewCases, setReviewCases] = useState<ReviewCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadReviewCases() {
    try {
      setError(null);
      setReviewCases(await getReviewCases());
    } catch {
      setError("Unable to load review cases. Confirm the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReviewCases();
  }, []);

  async function handleDecision(caseId: number, decision: "approve" | "reject") {
    const analystNote = window.prompt(
      "Analyst note",
      decision === "approve" ? "Approved after manual review." : "Rejected after manual review.",
    );
    if (!analystNote) {
      return;
    }

    try {
      if (decision === "approve") {
        await approveReviewCase(caseId, analystNote);
      } else {
        await rejectReviewCase(caseId, analystNote);
      }
      await loadReviewCases();
    } catch {
      setError("Unable to update review case.");
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Review Cases"
        description="Approve or reject suspicious transactions with a clear analyst note."
      />

      {error ? <ErrorState message={error} /> : null}
      {loading ? <LoadingState label="Loading review cases..." /> : null}
      {!loading && !reviewCases.length ? <EmptyState message="No review cases yet." /> : null}

      {reviewCases.length ? (
        <div className="grid gap-4">
          {reviewCases.map((reviewCase) => (
            <article
              key={reviewCase.id}
              data-testid="review-case-card"
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-ink">Case #{reviewCase.id}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Transaction #{reviewCase.transaction_id}
                  </p>
                </div>
                <StatusBadge status={reviewCase.status} />
              </div>
              <p className="mt-4 text-sm text-slate-600">{reviewCase.summary}</p>
              {reviewCase.analyst_note ? (
                <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                  Analyst note: {reviewCase.analyst_note}
                </p>
              ) : null}
              {reviewCase.status === "OPEN" ? (
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    data-testid="approve-review-case"
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                    onClick={() => void handleDecision(reviewCase.id, "approve")}
                  >
                    Approve
                  </button>
                  <button
                    data-testid="reject-review-case"
                    className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                    onClick={() => void handleDecision(reviewCase.id, "reject")}
                  >
                    Reject
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
