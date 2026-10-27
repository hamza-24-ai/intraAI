// components/auth/auth-skeleton.tsx
import { Aurora } from "@/components/ui/aurora";
import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";

const FULL_BLEED = "max-md:min-h-[calc(100dvh_-_4.5rem_-_env(safe-area-inset-top))]";

export function AuthSkeleton({ title = "Loading" }: { title?: string }) {
  return (
    <section
      aria-busy="true"
      className="relative isolate flex min-h-[calc(100dvh_-_4.5rem_-_env(safe-area-inset-top))] w-full justify-center md:items-center md:px-4 md:py-12"
    >
      <Aurora />
      <GlassCard
        className={`w-full p-6 md:max-w-[440px] md:p-8 max-md:rounded-none max-md:bg-white/90 max-md:shadow-none ${FULL_BLEED}`}
      >
        <h1 className="font-display text-2xl font-bold text-ink md:text-3xl">{title}</h1>
        <Skeleton className="mt-3 h-4 w-full" />
        <div className="mt-8 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-[52px] w-full" />
        </div>
      </GlassCard>
    </section>
  );
}
