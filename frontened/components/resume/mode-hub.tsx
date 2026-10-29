// components/resume/mode-hub.tsx
"use client";

import { BookOpen, Mic } from "lucide-react";
import { ModeCard } from "@/components/resume/mode-card";
import { ResumeRecap } from "@/components/resume/resume-recap";
import { Aurora } from "@/components/ui/aurora";
import { Skeleton } from "@/components/ui/skeleton";
import { useRequireResume } from "@/hooks/use-require-resume";
import { selectIsAuthenticated, useAuthStore } from "@/stores/auth-store";
import { useResumeStore } from "@/stores/resume-store";

function HubSkeleton() {
  return (
    <div aria-busy="true" className="mt-8 space-y-6">
      <p className="sr-only" role="status">
        Loading your practice modes
      </p>
      <Skeleton className="h-20 w-full rounded-2xl" />
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-3xl" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    </div>
  );
}

export function ModeHub() {
  const { ready } = useRequireResume();
  const parsed = useResumeStore((s) => s.parsed);
  const hydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isGuest = hydrated && !isAuthenticated;

  return (
    <section className="relative isolate w-full pb-16 pt-10 md:pt-14">
      <Aurora />
      <div className="mx-auto w-full max-w-300 px-4 md:px-10">
        <div className="max-w-2xl">
          <h1 className="font-display text-3xl font-bold text-ink md:text-4xl">
            How do you want to practice?
          </h1>
          <p className="mt-3 text-base text-slate-dark">Pick a mode. You can switch at any time.</p>
        </div>

        {ready ? (
          <>
            <div className="mt-8">
              <ResumeRecap
                targetRole={parsed?.target_role ?? null}
                skillCount={parsed?.skills.length ?? 0}
                isGuest={isGuest}
              />
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <ModeCard
                href="/questions"
                icon={BookOpen}
                title="Question Bank"
                description="Study questions for each of your skills"
                note="Read at your own pace"
                index={0}
              />
              <ModeCard
                href="/interview/setup"
                icon={Mic}
                title="Live Interview"
                description="Speak with an AI interviewer"
                note="15 or 30 minutes. Needs a microphone."
                index={1}
              />
            </div>
          </>
        ) : (
          <HubSkeleton />
        )}
      </div>
    </section>
  );
}
