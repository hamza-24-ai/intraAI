// hooks/use-require-resume.ts
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useResumeStore } from "@/stores/resume-store";

/** Gate for pages that need a resume context. Wait for `ready` before rendering. */
export function useRequireResume() {
  const router = useRouter();
  const ready = useResumeStore((s) => s.getContextPayload() !== null);

  useEffect(() => {
    // In-memory store: evaluated after mount so SSR and hydration agree.
    if (!ready) router.replace("/resume");
  }, [ready, router]);

  return { ready };
}
