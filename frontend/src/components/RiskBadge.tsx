import type { RiskLevel } from "../types/api";

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
