// src/components/providers.tsx
"use client";

import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { useAuthStore } from "@/stores/auth-store";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void useAuthStore.persist.rehydrate(); // sets hasHydrated via onRehydrateStorage
  }, []);

  return (
    <>
      {children}
      <Toaster position="top-center" richColors />
    </>
  );
}