import axios from "axios";

import type { FraudAlert, UserProfile } from "../types/api";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api",
});

export async function getUsers(): Promise<UserProfile[]> {
  const response = await api.get<UserProfile[]>("/users");
  return response.data;
}

export async function getAlerts(): Promise<FraudAlert[]> {
  const response = await api.get<FraudAlert[]>("/alerts");
  return response.data;
}
