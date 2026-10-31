// components/questions/missing-skills-notice.tsx
"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MissingSkillsNoticeProps {
  skills: string[];
  onRetry: () => void;
  disabled: boolean;
}

export function MissingSkillsNotice({ skills, onRetry, disabled }: MissingSkillsNoticeProps) {
  if (skills.length === 0) return null;

  return (
    <div
      role="status"
      className="mt-4 flex flex-col gap-3 rounded-2xl bg-warning-tint p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="flex items-start gap-2 text-sm font-medium text-warning">
        <AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0" />
        <span>We could not generate questions for: {skills.join(", ")}.</span>
      </p>
      <Button variant="outline" className="h-11 shrink-0" onClick={onRetry} disabled={disabled}>
        Try again
      </Button>
    </div>
  );
}
