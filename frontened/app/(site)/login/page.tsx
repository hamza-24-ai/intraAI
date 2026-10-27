// app/(site)/login/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthSkeleton } from "@/components/auth/auth-skeleton";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthSkeleton title="Sign in" />}>
      <LoginForm />
    </Suspense>
  );
}
