// lib/auth-redirect.ts
const AUTH_PREFIXES = ["/login", "/signup", "/verify"];
const CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F]/;

/** Returns `raw` only when it is a safe, same-origin, non-auth path. */
export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  if (raw.includes("\\")) return null;
  if (raw.includes("://")) return null;
  if (CONTROL_CHARS.test(raw)) return null;
  if (AUTH_PREFIXES.some((prefix) => raw.startsWith(prefix))) return null;

  // Dot segments or encoded slashes can normalize into a protocol-relative URL.
  const path = raw.split(/[?#]/, 1)[0];
  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(path);
  } catch {
    return null;
  }
  if (decodedPath.startsWith("//")) return null;
  if (decodedPath.split("/").some((segment) => segment === "." || segment === "..")) return null;

  return raw;
}
