import axios from "axios";

import type {
  FraudAlert,
  GroupProfile,
  GroupProfileCreate,
  ReviewCase,
  RiskScore,
  TransactionEvent,
  TransactionEventCreate,
  UserProfile,
  UserProfileCreate,
} from "../types/api";

export const api = axios.create({
  baseURL: "http://localhost:8000/api",
});

export function getApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return "Unexpected frontend error.";
  }

  const detail = error.response?.data?.detail;
  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item?.msg === "string") {
          return item.msg;
        }
        return JSON.stringify(item);
      })
      .join("; ");
  }

  return error.message;
}

export async function getUsers(): Promise<UserProfile[]> {
  const response = await api.get<UserProfile[]>("/users");
  return response.data;
}

export async function createUser(payload: UserProfileCreate): Promise<UserProfile> {
  const response = await api.post<UserProfile>("/users", payload);
  return response.data;
}

export async function getUserRisk(userId: number): Promise<RiskScore> {
  const response = await api.get<RiskScore>(`/users/${userId}/risk`);
  return response.data;
}

export async function getGroups(): Promise<GroupProfile[]> {
  const response = await api.get<GroupProfile[]>("/groups");
  return response.data;
}

export async function createGroup(payload: GroupProfileCreate): Promise<GroupProfile> {
  const response = await api.post<GroupProfile>("/groups", payload);
  return response.data;
}

export async function getGroupRisk(groupId: number): Promise<RiskScore> {
  const response = await api.get<RiskScore>(`/groups/${groupId}/risk`);
  return response.data;
}

export async function getTransactions(): Promise<TransactionEvent[]> {
  const response = await api.get<TransactionEvent[]>("/transactions");
  return response.data;
}

export async function createTransaction(
  payload: TransactionEventCreate,
): Promise<TransactionEvent> {
  const response = await api.post<TransactionEvent>("/transactions", payload);
  return response.data;
}

export async function scoreTransaction(transactionId: number): Promise<RiskScore> {
  const response = await api.post<RiskScore>(`/transactions/${transactionId}/score`);
  return response.data;
}

export async function getAlerts(): Promise<FraudAlert[]> {
  const response = await api.get<FraudAlert[]>("/alerts");
  return response.data;
}

export async function resolveAlert(alertId: number, analystNote: string): Promise<FraudAlert> {
  const response = await api.post<FraudAlert>(`/alerts/${alertId}/resolve`, { analystNote });
  return response.data;
}

export async function getReviewCases(): Promise<ReviewCase[]> {
  const response = await api.get<ReviewCase[]>("/review-cases");
  return response.data;
}

export async function approveReviewCase(
  caseId: number,
  analystNote: string,
): Promise<ReviewCase> {
  const response = await api.post<ReviewCase>(`/review-cases/${caseId}/approve`, { analystNote });
  return response.data;
}

export async function rejectReviewCase(
  caseId: number,
  analystNote: string,
): Promise<ReviewCase> {
  const response = await api.post<ReviewCase>(`/review-cases/${caseId}/reject`, { analystNote });
  return response.data;
}
