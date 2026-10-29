// components/resume/upload-error.tsx
"use client";

import { AlertCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FlowBorder } from "@/components/ui/flow-border";
import { formatFileSize, UPLOAD_ERROR_COPY, type UploadErrorKind } from "@/lib/resume-errors";

interface UploadErrorProps {
  kind: UploadErrorKind;
  file: File | null;
  onRetry: () => void;
  onChooseAnother: () => void;
  onManual: () => void;
}

const RETRY_KINDS: UploadErrorKind[] = ["parseFailed", "network", "timeout", "server"];
const MANUAL_KINDS: UploadErrorKind[] = ["noText", "parseFailed"];

export function UploadError({ kind, file, onRetry, onChooseAnother, onManual }: UploadErrorProps) {
  const copy = UPLOAD_ERROR_COPY[kind];
  const canRetry = RETRY_KINDS.includes(kind);
  const canManual = MANUAL_KINDS.includes(kind);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <FlowBorder radius={20} width={2} invalid className="bg-error-tint">
      <div role="alert" className="space-y-4 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 size-6 shrink-0 text-error" aria-hidden />
          <div className="min-w-0 space-y-1">
            <h2
              ref={headingRef}
              tabIndex={-1}
              data-state-heading
              className="font-display text-xl font-bold text-error focus:outline-none"
            >
              {copy.title}
            </h2>
            {copy.hint ? <p className="text-sm font-medium text-error">{copy.hint}</p> : null}
            {kind === "tooLarge" && file ? (
              <p className="text-sm text-error">Your file is {formatFileSize(file.size)}.</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {canRetry ? (
            <Button type="button" size="lg" className="w-full sm:w-auto" onClick={onRetry}>
              Try again
            </Button>
          ) : (
            <Button type="button" size="lg" className="w-full sm:w-auto" onClick={onChooseAnother}>
              Choose another file
            </Button>
          )}
          {canManual ? (
            <Button type="button" variant="outline" className="h-12 w-full sm:w-auto" onClick={onManual}>
              Enter details manually
            </Button>
          ) : null}
        </div>
      </div>
    </FlowBorder>
  );
}
