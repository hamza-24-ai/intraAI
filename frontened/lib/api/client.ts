// src/lib/api/client.ts
import axios from "axios";
import { env } from "@/lib/env";
import { useAuthStore } from "@/stores/auth-store";

export const api = axios.create({ baseURL: env.API_URL, timeout: 30_000 });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    // Expired/invalid token: clear it, route guards then redirect to /login.
    // (Optional-login endpoints never 401, the backend just treats you as anonymous.)
    if (axios.isAxiosError(error) && error.response?.status === 401 && useAuthStore.getState().accessToken) {
      useAuthStore.getState().clearSession();
    }
    return Promise.reject(error);
  }
);

/** FastAPI errors: `detail` is a string, or a list of validation errors on 422. */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ detail?: unknown }>(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map((d) => d?.msg ?? "Invalid input").join(", ");
    if (error.code === "ECONNABORTED") return "The request took too long. Please try again.";
    if (!error.response) return "Cannot reach the server. Check your connection.";
  } else if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}