// lib/auth-errors.ts
import axios from "axios";

type SignupErrorMap = { field?: "email" | "password"; message: string };

/** Turns backend signup messages into friendly, field-scoped errors. */
export function mapSignupError(message: string): SignupErrorMap {
  const lower = message.toLowerCase();

  if (lower.includes("already registered") || lower.includes("already exists")) {
    return { field: "email", message: "An account with this email already exists." };
  }

  if (
    lower.includes("password") &&
    (lower.includes("at least") || lower.includes("weak") || lower.includes("short"))
  ) {
    return { field: "password", message: "Choose a stronger password (at least 8 characters)." };
  }

  if (lower.includes("rate limit") || lower.includes("too many") || lower.includes("seconds")) {
    return { message: "Too many attempts. Please wait a few minutes and try again." };
  }

  return { message };
}

/** True only for an Axios error carrying HTTP 401. */
export function isUnauthorized(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401;
}
