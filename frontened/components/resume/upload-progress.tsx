// components/resume/upload-progress.tsx
"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Clock, FileText, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FlowBorder } from "@/components/ui/flow-border";
import { formatFileSize } from "@/lib/resume-errors";
import { cn } from "@/lib/utils";

export type UploadStep = 0 | 1 | 2 | 3;

interface UploadProgressProps {
  file: File;
  percent: number;
  step: UploadStep;
  slow: boolean;
  onCancel: () => void;
}

const STEPS = ["Uploading", "Reading your resume", "Extracting skills"] as const;

const HEADINGS = [
  "Uploading your resume",
  "Reading your resume",
  "Extracting skills",
  "Finishing up",
] as const;

const ANNOUNCEMENTS = [
  "Uploading your resume.",
  "Upload finished. Reading your resume.",
  "Extracting skills.",
  "Finishing up.",
] as const;

export function UploadProgress({ file, percent, step, slow, onCancel }: UploadProgressProps) {
  const reduce = useReducedMotion();
  const uploading = step === 0;
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h2
          ref={headingRef}
          tabIndex={-1}
          data-state-heading
          className="font-display text-xl font-bold text-ink focus:outline-none"
        >
          {HEADINGS[step]}
        </h2>
        <p className="mt-1 text-sm text-slate-dark">This can take up to a minute.</p>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {ANNOUNCEMENTS[step]}
      </p>

      <FlowBorder radius={16} width={1.5} motion="hover" className="bg-white">
        <div className="flex items-center gap-3 p-4">
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-light text-brand-violet">
            <FileText className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-ink" title={file.name}>
              {file.name}
            </p>
            <p className="text-sm text-slate-dark">{formatFileSize(file.size)}</p>
          </div>
          <Button type="button" variant="outline" className="shrink-0" onClick={onCancel}>
            <X className="size-4" aria-hidden />
            Cancel
          </Button>
        </div>
      </FlowBorder>

      <div className="space-y-4">
        <ol aria-label="Resume processing steps" className="flex items-start">
          {STEPS.map((label, i) => {
            const done = step > i;
            const current = step === i;
            return (
              <li
                key={label}
                aria-current={current ? "step" : undefined}
                className="flex flex-1 flex-col items-center gap-1.5"
              >
                <div className="flex w-full items-center">
                  <span
                    aria-hidden
                    className={cn("size-2.5 shrink-0 rounded-full", done || current ? "bg-emerald-dark" : "bg-slate-dark/40")}
                  />
                  <span
                    aria-hidden
                    className={cn(
                      "h-0.5 flex-1",
                      done ? "bg-emerald-dark" : "bg-slate-light",
                      i === STEPS.length - 1 && "invisible"
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-center text-xs leading-tight",
                    current ? "font-semibold text-ink" : "text-slate-dark"
                  )}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>

        <div className="flex items-center gap-3">
          <div
            role="progressbar"
            aria-label="Upload progress"
            aria-valuemin={0}
            aria-valuemax={100}
            {...(uploading
              ? { "aria-valuenow": percent }
              : { "aria-valuetext": step === 3 ? "Almost done" : "In progress" })}
            className="h-2 w-full overflow-hidden rounded-full bg-slate-light"
          >
            {uploading ? (
              <div
                className="h-full rounded-full bg-emerald-dark transition-[width] duration-300 ease-out"
                style={{ width: `${Math.max(percent, 4)}%` }}
              />
            ) : step === 3 || reduce ? (
              <div className={cn("h-full rounded-full bg-emerald-dark", step === 3 ? "w-full" : "w-1/2 opacity-70")} />
            ) : (
              <motion.div
                className="h-full w-1/3 rounded-full bg-emerald-dark"
                animate={{ x: ["-100%", "300%"] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </div>
          {uploading ? (
            <span className="w-11 shrink-0 text-right text-sm font-semibold tabular-nums text-ink">
              {percent}%
            </span>
          ) : null}
        </div>
      </div>

      {slow && step < 3 ? (
        <p className="flex items-start gap-2 rounded-xl bg-warning-tint px-4 py-3 text-sm font-medium text-warning" role="status">
          <Clock className="mt-0.5 size-4 shrink-0" aria-hidden />
          This is taking longer than usual, but we are still working on it.
        </p>
      ) : null}
    </div>
  );
}
