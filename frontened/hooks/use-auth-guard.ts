// hooks/use-auth-guard.ts
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { selectIsAuthenticated, useAuthStore } from "@/stores/auth-store";

/** For pages that require login (history, past reports). Wait for `ready` before rendering. */
export function useAuthGuard(redirectTo = "/login") {
  const router = useRouter();
  const ready = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  useEffect(() => {
    if (ready && !isAuthenticated) router.replace(redirectTo);
  }, [ready, isAuthenticated, redirectTo, router]);

  return { ready, isAuthenticated };
}