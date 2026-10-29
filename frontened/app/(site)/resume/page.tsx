// app/(site)/resume/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { FolderKanban, ShieldCheck, Sparkles, Target } from "lucide-react";
import { ResumeUploadFlow } from "@/components/resume/resume-upload-flow";
import { Aurora } from "@/components/ui/aurora";
import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Upload your resume",
};

const READS = [
  { icon: Sparkles, label: "Skills" },
  { icon: FolderKanban, label: "Projects" },
  { icon: Target, label: "Target role" },
] as const;

function ResumeFlowSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading upload form" className="space-y-6">
      <p className="sr-only" role="status">
        Loading upload form
      </p>
      <Skeleton className="h-[260px] w-full rounded-[20px]" />
      <Skeleton className="h-16 w-full rounded-2xl" />
    </div>
  );
}

export default function ResumePage() {
  return (
    <section className="relative isolate w-full pb-16 pt-10 md:pt-14">
      <Aurora />
      <div className="mx-auto w-full max-w-300 px-4 md:px-10">
        <div className="max-w-2xl">
          <h1 className="font-display text-3xl font-bold text-ink md:text-4xl">Upload your resume</h1>
          <p className="mt-3 text-base text-slate-dark">
            PDF or DOCX, up to 5 MB. We only read skills, projects and your target role.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 lg:max-w-[720px]">
            <Suspense fallback={<ResumeFlowSkeleton />}>
              <ResumeUploadFlow />
            </Suspense>
          </div>

          <aside className="lg:col-span-4">
            <GlassCard className="p-6">
              <h2 className="font-display text-lg font-bold text-ink">What we read</h2>
              <ul className="mt-4 space-y-3">
                {READS.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-3 text-sm font-medium text-ink">
                    <span className="inline-flex size-9 items-center justify-center rounded-lg bg-mint text-emerald-dark">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    {label}
                  </li>
                ))}
              </ul>
              <p className="mt-5 flex items-start gap-2 text-sm text-slate-dark">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-dark" aria-hidden />
                Your file is used only to prepare your practice session. We never share it.
              </p>
            </GlassCard>
          </aside>
        </div>
      </div>
    </section>
  );
}
