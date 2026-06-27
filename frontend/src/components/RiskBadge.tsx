import type { AlertSeverity, AlertStatus, Recommendation, ReviewCaseStatus, RiskLevel } from "../types/api";

const styles: Record<RiskLevel, string> = {
  LOW: "bg-emerald-100 text-emerald-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  HIGH: "bg-red-100 text-red-700",
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[level]}`}>
      {level}
    </span>
  );
}

const recommendationStyles: Record<Recommendation, string> = {
  APPROVE: "bg-emerald-100 text-emerald-700",
  REVIEW: "bg-blue-100 text-blue-700",
  BLOCK: "bg-red-100 text-red-700",
};

const severityStyles: Record<AlertSeverity, string> = {
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  HIGH: "bg-red-100 text-red-700",
  CRITICAL: "bg-purple-100 text-purple-700",
};

const statusStyles: Record<AlertStatus | ReviewCaseStatus, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  RESOLVED: "bg-emerald-100 text-emerald-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
};

function Badge({ value, className }: { value: string; className: string }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${className}`}>{value}</span>
  );
}

export function RecommendationBadge({ recommendation }: { recommendation: Recommendation }) {
  return <Badge value={recommendation} className={recommendationStyles[recommendation]} />;
}

export function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  return <Badge value={severity} className={severityStyles[severity]} />;
}

export function StatusBadge({ status }: { status: AlertStatus | ReviewCaseStatus }) {
  return <Badge value={status} className={statusStyles[status]} />;
}
