// app/(site)/questions/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { QuestionBankView } from "@/components/questions/question-bank-view";
import { Aurora } from "@/components/ui/aurora";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Question Bank",
};

function ViewSkeleton() {
  return (
    <section className="relative isolate w-full pb-10 pt-10 md:pt-14">
      <Aurora />
      <div className="mx-auto w-full max-w-300 px-4 md:px-10">
        <p role="status" className="sr-only">
          Loading your question bank
        </p>
        <h1 className="font-display text-3xl font-bold text-ink md:text-4xl">Your Question Bank</h1>
        <Skeleton className="mt-3 h-5 w-48" />
        <div className="mt-8 space-y-3">
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    </section>
  );
}

export default function QuestionsPage() {
  return (
    <Suspense fallback={<ViewSkeleton />}>
      <QuestionBankView />
    </Suspense>
  );
}
