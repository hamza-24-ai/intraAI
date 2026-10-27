// lib/verify-params.ts
import { loginFormSchema } from "@/lib/schemas";

export type VerifyState =
  | { kind: "success" }
  | { kind: "error"; code: string | null; email: string | null }
  | { kind: "pending"; email: string }
  | { kind: "request"; email: null };

const emailSchema = loginFormSchema.shape.email;

function readParam(query: URLSearchParams, hash: URLSearchParams, key: string): string | null {
  const value = query.get(key) ?? hash.get(key);
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isValidEmail(value: string | null): value is string {
  return value !== null && emailSchema.safeParse(value).success;
}

/**
 * Reads Supabase verification params from the URL. Query params take precedence
 * over hash params; raw error descriptions are never surfaced.
 */
export function parseVerifyParams({ search, hash }: { search: string; hash: string }): VerifyState {
  const query = new URLSearchParams(search.replace(/^\?/, ""));
  const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
  const get = (key: string) => readParam(query, hashParams, key);

  const email = get("email");
  const validEmail = isValidEmail(email) ? email : null;

  const error = get("error");
  const errorCode = get("error_code");
  const errorDescription = get("error_description");

  if (error || errorCode || errorDescription) {
    return { kind: "error", code: errorCode ?? error, email: validEmail };
  }

  const type = get("type");
  if (
    get("access_token") ||
    get("code") ||
    get("token_hash") ||
    type === "signup" ||
    type === "email"
  ) {
    return { kind: "success" };
  }

  if (validEmail) return { kind: "pending", email: validEmail };

  return { kind: "request", email: null };
}
