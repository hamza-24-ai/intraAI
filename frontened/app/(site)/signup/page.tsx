// app/(site)/signup/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthSkeleton } from "@/components/auth/auth-skeleton";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Create account",
};

export default function SignupPage() {
  return (
    <Suspense fallback={<AuthSkeleton title="Create account" />}>
      <SignupForm />
    </Suspense>
  );
}
