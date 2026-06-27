export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type Recommendation = "APPROVE" | "REVIEW" | "BLOCK";
export type TransactionType = "CONTRIBUTION" | "FUNDING_REQUEST" | "DISBURSEMENT" | "REPAYMENT";
export type TransactionStatus = "PENDING" | "SUCCESS" | "FAILED";
export type AlertSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type AlertStatus = "OPEN" | "RESOLVED";
export type ReviewCaseStatus = "OPEN" | "APPROVED" | "REJECTED";

export interface UserProfile {
  id: number;
  external_id: string;
  full_name: string;
  email?: string | null;
  account_age_days: number;
  contribution_count: number;
  failed_transaction_count: number;
  successful_repayment_count: number;
  reputation_score: number;
  created_at: string;
}

export interface UserProfileCreate {
  external_id: string;
  full_name: string;
  email?: string;
  account_age_days: number;
  contribution_count: number;
  failed_transaction_count: number;
  successful_repayment_count: number;
  reputation_score: number;
}

export interface GroupProfile {
  id: number;
  external_id: string;
  name: string;
  member_count: number;
  default_rate: string;
  suspicious_activity_count: number;
  created_at: string;
}

export interface GroupProfileCreate {
  external_id: string;
  name: string;
  member_count: number;
  default_rate: string;
  suspicious_activity_count: number;
}

export interface TransactionEvent {
  id: number;
  user_id: number;
  group_id?: number | null;
  transaction_type: TransactionType;
  amount: string;
  currency: string;
  status: TransactionStatus;
  metadata_json: Record<string, unknown>;
  created_at: string;
}

export interface TransactionEventCreate {
  user_id: number;
  group_id?: number;
  transaction_type: TransactionType;
  amount: string;
  currency: string;
  status: TransactionStatus;
  metadata_json?: Record<string, unknown>;
}

export interface FraudAlert {
  id: number;
  transaction_id?: number | null;
  risk_score_id: number;
  severity: AlertSeverity;
  status: AlertStatus;
  reason: string;
  created_at: string;
}

export interface ReviewCase {
  id: number;
  transaction_id?: number | null;
  risk_score_id: number;
  status: ReviewCaseStatus;
  summary: string;
  analyst_note?: string | null;
  created_at: string;
}

export interface RiskScore {
  id: number;
  subject_type: "USER" | "GROUP" | "TRANSACTION";
  transaction_id?: number | null;
  user_id?: number | null;
  group_id?: number | null;
  score: number;
  level: RiskLevel;
  reasons: string[];
  recommendation: Recommendation;
  created_at: string;
}
