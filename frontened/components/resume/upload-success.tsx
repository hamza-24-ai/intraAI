// components/resume/upload-success.tsx
"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import type { ParsedResume } from "@/lib/schemas";
import { POP_SPRING } from "@/lib/motion";

interface UploadSuccessProps {
  parsed: ParsedResume;
  saved: boolean;
  onContinue: () => void;
  onEdit: () => void;
}

function CheckMark() {
  const reduce = useReducedMotion();
  return (
    <svg viewBox="0 0 52 52" className="size-14 shrink-0" aria-hidden>
      <circle cx="26" cy="26" r="24" fill="none" stroke="var(--color-emerald-dark)" strokeWidth="2.5" opacity="0.35" />
      <motion.path
        d="M15 27l8 8 15-17"
        fill="none"
        stroke="var(--color-emerald-dark)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={reduce ? { duration: 0 } : { duration: 0.6, ease: "easeOut" }}
      />
    </svg>
  );
}

export function UploadSuccess({ parsed, saved, onContinue, onEdit }: UploadSuccessProps) {
  const reduce = useReducedMotion();
  const noSkills = parsed.skills.length === 0;
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <CheckMark />
        <div>
          <h2
            ref={headingRef}
            tabIndex={-1}
            data-state-heading
            className="font-display text-xl font-bold text-ink focus:outline-none"
          >
            Resume read
          </h2>
          <p className="text-sm text-slate-dark">
            {parsed.projects.length} {parsed.projects.length === 1 ? "project" : "projects"} found
          </p>
        </div>
      </div>

      {parsed.target_role ? (
        <p className="text-sm text-ink">
          Target role: <span className="font-semibold">{parsed.target_role}</span>
        </p>
      ) : (
        <p className="flex items-start gap-2 rounded-xl bg-warning-tint px-4 py-3 text-sm font-medium text-warning">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          We could not tell your target role. You will pick it on the next screen.
        </p>
      )}

      {noSkills ? (
        <p className="flex items-start gap-2 rounded-xl bg-warning-tint px-4 py-3 text-sm font-medium text-warning">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          We did not find any skills. Add them on the next screen.
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-dark">Skills we found</p>
          <ul className="flex flex-wrap gap-2" aria-label="Skills found in your resume">
            {parsed.skills.map((skill, index) => (
              <motion.li
                key={skill}
                initial={reduce ? false : { scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={reduce ? { duration: 0 } : { ...POP_SPRING, delay: index * 0.06 }}
                className="inline-flex min-h-9 items-center rounded-full bg-violet-light px-3 text-sm font-semibold text-violet-deep"
              >
                {skill}
              </motion.li>
            ))}
          </ul>
        </div>
      )}

      {saved ? (
        <p className="flex items-start gap-2 rounded-xl bg-mint px-4 py-3 text-sm font-medium text-emerald-dark">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
          Saved to your account.
        </p>
      ) : (
        <div className="space-y-1 rounded-xl bg-violet-light px-4 py-3 text-sm text-ink">
          <p className="flex items-start gap-2 font-medium">
            <Info className="mt-0.5 size-4 shrink-0 text-brand-violet" aria-hidden />
            You are using IntraAI as a guest. This resume is only used in this session and is not saved.
          </p>
          <Link
            href="/login?next=/start"
            className="inline-flex min-h-11 items-center font-semibold text-brand-violet underline underline-offset-4"
          >
            Sign in to keep your history
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="button" size="lg" className="w-full sm:w-auto" onClick={onContinue}>
          Continue
        </Button>
        <Button type="button" variant="outline" size="lg" className="w-full sm:w-auto" onClick={onEdit}>
          Edit details
        </Button>
      </div>
    </div>
  );
}
