// app/(site)/resume/confirm/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { ConfirmForm } from "@/components/resume/confirm-form";
import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Check your details",
};

function ConfirmSkeleton() {
  return (
    <section aria-busy="true" className="w-full pb-10 pt-10 md:pt-14">
      <div className="mx-auto w-full max-w-300 px-4 md:px-10">
        <p className="sr-only" role="status">
          Loading your details
        </p>
        <h1 className="font-display text-3xl font-bold text-ink md:text-4xl">Check your details</h1>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <GlassCard className="space-y-3 p-6">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-24 w-full" />
          </GlassCard>
          <GlassCard className="space-y-3 p-6">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </GlassCard>
        </div>
      </div>
    </section>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<ConfirmSkeleton />}>
      <ConfirmForm />
    </Suspense>
  );
}
