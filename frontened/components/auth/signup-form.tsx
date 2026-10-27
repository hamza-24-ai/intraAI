// components/auth/signup-form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthSkeleton } from "@/components/auth/auth-skeleton";
import { FormBanner } from "@/components/auth/form-banner";
import { FormField } from "@/components/auth/form-field";
import { PasswordInput } from "@/components/auth/password-input";
import { SubmitButton } from "@/components/auth/submit-button";
import { Button } from "@/components/ui/button";
import { FlowInput } from "@/components/ui/flow-input";
import { useRedirectIfAuthenticated } from "@/hooks/use-redirect-if-authenticated";
import { signup } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/client";
import { mapSignupError } from "@/lib/auth-errors";
import { signupFormSchema, type SignupForm, type SignupPayload } from "@/lib/schemas";

const ACTIONS_CLASS =
  "sticky bottom-0 z-10 mt-auto space-y-3 -mx-6 -mb-6 bg-white/85 px-6 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-md md:static md:mx-0 md:mb-0 md:bg-transparent md:px-0 md:pt-0 md:pb-0 md:backdrop-blur-none";

type Banner = { tone: "error" | "success"; text: string; loginLink?: boolean };

export function SignupForm() {
  const router = useRouter();
  const { pending } = useRedirectIfAuthenticated();

  const [banner, setBanner] = useState<Banner | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupFormSchema),
    mode: "onTouched",
  });

  const onSubmit = handleSubmit(async (values) => {
    setBanner(null);
    const payload: SignupPayload = {
      name: values.name.trim(),
      email: values.email,
      password: values.password,
    };

    try {
      await signup(payload);
      router.push(`/verify?email=${encodeURIComponent(values.email)}`);
    } catch (error) {
      const mapped = mapSignupError(getErrorMessage(error));
      if (mapped.field) {
        setError(mapped.field, { type: "server", message: mapped.message });
        setFocus(mapped.field);
        if (mapped.field === "email") {
          setBanner({ tone: "error", text: mapped.message, loginLink: true });
        }
      } else {
        setBanner({ tone: "error", text: mapped.message });
      }
    }
  });

  if (pending) return <AuthSkeleton title="Create your account" />;

  return (
    <AuthShell
      title="Create your account"
      subtitle="Practise interviews free. An account keeps your history safe."
      footer={
        <p>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand-violet underline underline-offset-4">
            Sign in
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
                {banner.loginLink ? (
                  <Link href="/login" className="inline-block underline underline-offset-4">
                    Sign in instead
                  </Link>
                ) : null}
              </FormBanner>
            ) : null}
          </AnimatePresence>

          <FormField label="Full name" error={errors.name?.message}>
            <FlowInput
              type="text"
              autoComplete="name"
              placeholder="Your name"
              invalid={Boolean(errors.name)}
              disabled={isSubmitting}
              {...register("name")}
            />
          </FormField>

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

          <FormField label="Password" hint="At least 8 characters" error={errors.password?.message}>
            <PasswordInput
              autoComplete="new-password"
              placeholder="Create a password"
              invalid={Boolean(errors.password)}
              disabled={isSubmitting}
              {...register("password")}
            />
          </FormField>

          <FormField label="Confirm password" error={errors.confirmPassword?.message}>
            <PasswordInput
              autoComplete="new-password"
              placeholder="Repeat your password"
              invalid={Boolean(errors.confirmPassword)}
              disabled={isSubmitting}
              {...register("confirmPassword")}
            />
          </FormField>
        </div>

        <div className={ACTIONS_CLASS}>
          <SubmitButton className="mt-2" loading={isSubmitting}>Create account</SubmitButton>
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
