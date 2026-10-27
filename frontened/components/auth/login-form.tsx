// components/auth/login-form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthSkeleton } from "@/components/auth/auth-skeleton";
import { FormBanner } from "@/components/auth/form-banner";
import { FormField } from "@/components/auth/form-field";
import { PasswordInput } from "@/components/auth/password-input";
import { SubmitButton } from "@/components/auth/submit-button";
import { Button } from "@/components/ui/button";
import { FlowInput } from "@/components/ui/flow-input";
import { useRedirectIfAuthenticated } from "@/hooks/use-redirect-if-authenticated";
import { login } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/client";
import { isUnauthorized } from "@/lib/auth-errors";
import { safeNextPath } from "@/lib/auth-redirect";
import { DEFAULT_AFTER_LOGIN } from "@/lib/constants";
import { loginFormSchema, type LoginInput } from "@/lib/schemas";

const ACTIONS_CLASS =
  "sticky bottom-0 z-10 mt-auto space-y-3 -mx-6 -mb-6 bg-white/85 px-6 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-md md:static md:mx-0 md:mb-0 md:bg-transparent md:px-0 md:pt-0 md:pb-0 md:backdrop-blur-none";

type Banner = { tone: "error" | "success"; text: string; resendEmail?: string };

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const verified = searchParams.get("verified") === "1";
  const { pending } = useRedirectIfAuthenticated();

  const [banner, setBanner] = useState<Banner | null>(
    verified ? { tone: "success", text: "Your email is verified. Sign in to continue." } : null
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginFormSchema),
    mode: "onTouched",
  });

  const onSubmit = handleSubmit(async (values) => {
    setBanner(null);
    try {
      await login(values);
      toast.success("Welcome back");
      router.replace(next ?? DEFAULT_AFTER_LOGIN);
    } catch (error) {
      if (isUnauthorized(error)) {
        setBanner({
          tone: "error",
          text: "Wrong email or password, or your email isn't verified yet.",
          resendEmail: values.email,
        });
      } else {
        setBanner({ tone: "error", text: getErrorMessage(error) });
      }
    }
  });

  if (pending) return <AuthSkeleton title="Welcome back" />;

  const signupHref = next ? `/signup?next=${encodeURIComponent(next)}` : "/signup";

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to save your practice history and feedback."
      footer={
        <p>
          New here?{" "}
          <Link href={signupHref} className="font-semibold text-brand-violet underline underline-offset-4">
            Create a free account
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-1 flex-col">
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {banner ? (
              <FormBanner key={banner.tone} tone={banner.tone}>
                <p>{banner.text}</p>
                {banner.resendEmail ? (
                  <Link
                    href={`/verify?email=${encodeURIComponent(banner.resendEmail)}`}
                    className="inline-block underline underline-offset-4"
                  >
                    Resend verification email
                  </Link>
                ) : null}
              </FormBanner>
            ) : null}
          </AnimatePresence>

          <FormField label="Email" error={errors.email?.message}>
            <FlowInput
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              invalid={Boolean(errors.email)}
              disabled={isSubmitting}
              {...register("email")}
            />
          </FormField>

          <FormField label="Password" error={errors.password?.message}>
            <PasswordInput
              autoComplete="current-password"
              placeholder="Your password"
              invalid={Boolean(errors.password)}
              disabled={isSubmitting}
              {...register("password")}
            />
          </FormField>
        </div>

        <div className={ACTIONS_CLASS}>
          <SubmitButton className="mt-3" loading={isSubmitting}>Sign in</SubmitButton>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            disabled={isSubmitting}
            onClick={() => router.push("/resume")}
          >
            Continue as guest
          </Button>
          <p className="text-center text-sm text-slate-dark">
            No account needed. Sign in only to save your history.
          </p>
        </div>
      </form>
    </AuthShell>
  );
}
