// hooks/use-redirect-if-authenticated.ts
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { safeNextPath } from "@/lib/auth-redirect";
import { DEFAULT_AFTER_LOGIN } from "@/lib/constants";
import { selectIsAuthenticated, useAuthStore } from "@/stores/auth-store";

/**
 * Sends authenticated visitors away from login/signup once the persisted store
 * has hydrated. `pending` is true while the redirect is still in flight so the
 * form can render a skeleton instead of flashing.
 */
export function useRedirectIfAuthenticated(target?: string) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ready = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const next = searchParams.get("next");

  useEffect(() => {
    if (!ready || !isAuthenticated) return;
    router.replace(safeNextPath(next) ?? target ?? DEFAULT_AFTER_LOGIN);
  }, [ready, isAuthenticated, next, target, router]);

  return { ready, isAuthenticated, pending: !ready || isAuthenticated };
}
