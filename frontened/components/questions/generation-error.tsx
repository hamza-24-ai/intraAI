// components/questions/generation-error.tsx
"use client";

import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlowBorder } from "@/components/ui/flow-border";

interface GenerationErrorProps {
  message: string;
  online: boolean;
  retrying: boolean;
  onRetry: () => void;
  onBack: () => void;
}

export function GenerationError({ message, online, retrying, onRetry, onBack }: GenerationErrorProps) {
  return (
    <FlowBorder invalid radius={20} width={2} className="mt-8 bg-error-tint">
      <div role="alert" className="p-6">
        <div className="flex items-start gap-3">
          <AlertCircle aria-hidden className="mt-0.5 size-6 shrink-0 text-error" />
          <div>
            <h2 className="font-display text-xl font-bold text-ink">We could not build your question bank</h2>
            <p className="mt-1 text-sm text-ink">{message}</p>
            {!online ? (
              <p className="mt-1 text-sm text-slate-dark">
                You are offline. Try again once you reconnect.
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button size="lg" className="w-full sm:w-auto" onClick={onRetry} disabled={!online || retrying}>
            {retrying ? (
              <Loader2 aria-hidden className="animate-spin" />
            ) : (
              <RefreshCw aria-hidden />
            )}
            Try again
          </Button>
          <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={onBack}>
            Back to your resume
          </Button>
        </div>
      </div>
    </FlowBorder>
  );
}
