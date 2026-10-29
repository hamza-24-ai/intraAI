// components/auth/verify-view.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormField } from "@/components/auth/form-field";
import { ResendButton } from "@/components/auth/resend-button";
import {
  CheckIllustration,
  EnvelopeIllustration,
  WarningIllustration,
} from "@/components/auth/verify-illustrations";
import { Button } from "@/components/ui/button";
import { FlowInput } from "@/components/ui/flow-input";
import { Skeleton } from "@/components/ui/skeleton";
import { resendFormSchema, type ResendForm } from "@/lib/schemas";
import { parseVerifyParams, type VerifyState } from "@/lib/verify-params";

const LINK_CLASS = "inline-flex min-h-12 items-center font-semibold text-brand-violet underline underline-offset-4";

export function VerifyView() {
  const router = useRouter();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [state, setState] = useState<VerifyState | null>(null);

  useEffect(() => {
    const parsed = parseVerifyParams({
      search: window.location.search,
      hash: window.location.hash,
    });

    // Never keep tokens, codes, or raw Supabase error text in the address bar.
    if (parsed.kind === "success") {
      window.history.replaceState(null, "", "/verify");
    } else if (parsed.kind === "error") {
      const query = parsed.email ? `?email=${encodeURIComponent(parsed.email)}` : "";
      window.history.replaceState(null, "", `/verify${query}`);
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- the URL is only readable after mount
    setState(parsed);
  }, []);

  useEffect(() => {
    if (state) titleRef.current?.focus();
  }, [state]);

  if (!state) {
    return (
      <AuthShell title="Checking your link" titleRef={titleRef}>
        <div className="flex flex-1 flex-col" aria-hidden>
          <Skeleton className="mx-auto h-[140px] w-[140px] rounded-2xl" />
          <Skeleton className="mt-6 h-4 w-full" />
          <Skeleton className="mt-3 h-4 w-3/4" />
          <Skeleton className="mt-8 h-12 w-full" />
        </div>
        <span role="status" className="sr-only">
          Checking your verification link
        </span>
      </AuthShell>
    );
  }

  if (state.kind === "success") {
    return (
      <AuthShell title="Email verified" titleRef={titleRef}>
        <div className="flex flex-1 flex-col items-center text-center">
          <CheckIllustration />
          <p className="mt-4 text-sm text-slate-dark">Your account is ready.</p>
          <Button size="lg" className="mt-8 w-full" onClick={() => router.push("/login?verified=1")}>
            Sign in
          </Button>
        </div>
      </AuthShell>
    );
  }

  if (state.kind === "pending") {
    return (
      <AuthShell title="Check your inbox" titleRef={titleRef}>
        <div className="flex flex-1 flex-col items-center text-center">
          <EnvelopeIllustration />
          <p className="mt-4 text-sm text-slate-dark">
            We sent a verification link to{" "}
            <span className="font-semibold text-ink">{state.email}</span>. Click it to activate your
            account.
          </p>
          <div className="mt-6 w-full space-y-4">
            <ResendButton email={state.email} autoStart />
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-sm">
              <Link href="/signup" className={LINK_CLASS}>
                Change email
              </Link>
              <Link href="/login" className={LINK_CLASS}>
                Back to sign in
              </Link>
            </div>
          </div>
          <p className="mt-6 text-sm text-slate-dark">Can&apos;t find it? Check your spam folder.</p>
        </div>
      </AuthShell>
    );
  }

  if (state.kind === "error") {
    return (
      <AuthShell title="This link is invalid or has expired" titleRef={titleRef}>
        <div className="flex flex-1 flex-col items-center text-center">
          <WarningIllustration />
          <p className="mt-4 text-sm text-slate-dark">
            Verification links expire quickly and can only be used once. Enter your email and
            we&apos;ll send you a new link.
          </p>
          <div className="mt-6 w-full text-left">
            <ResendEmailForm defaultEmail={state.email ?? ""} />
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Verify your email" titleRef={titleRef}>
      <div className="flex flex-1 flex-col items-center text-center">
        <EnvelopeIllustration />
        <p className="mt-4 text-sm text-slate-dark">
          Enter your email and we&apos;ll send you a new link.
        </p>
        <div className="mt-6 w-full text-left">
          <ResendEmailForm defaultEmail="" />
        </div>
      </div>
    </AuthShell>
  );
}

function ResendEmailForm({ defaultEmail }: { defaultEmail: string }) {
  const {
    register,
    control,
    trigger,
    formState: { errors },
  } = useForm<ResendForm>({
    resolver: zodResolver(resendFormSchema),
    mode: "onTouched",
    defaultValues: { email: defaultEmail },
  });

  const email = useWatch({ control, name: "email" }) ?? "";

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void trigger();
      }}
    >
      <FormField label="Email" error={errors.email?.message}>
        <FlowInput
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          invalid={Boolean(errors.email)}
          {...register("email")}
        />
      </FormField>
      <ResendButton email={email} />
    </form>
  );
}
