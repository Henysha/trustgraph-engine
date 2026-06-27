export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type Recommendation = "APPROVE" | "REVIEW" | "BLOCK";

export interface UserProfile {
  id: number;
  external_id: string;
  full_name: string;
  email?: string | null;
  account_age_days: number;
  contribution_count: number;
  failed_transaction_count: number;
  reputation_score: number;
  created_at: string;
}

export interface FraudAlert {
  id: number;
  transaction_id?: number | null;
  risk_score_id: number;
  status: "OPEN" | "RESOLVED";
  reason: string;
  created_at: string;
}

export interface RiskScore {
  id: number;
  transaction_id?: number | null;
  user_id?: number | null;
  group_id?: number | null;
  score: number;
  level: RiskLevel;
  reasons: string[];
  recommendation: Recommendation;
  created_at: string;
}
