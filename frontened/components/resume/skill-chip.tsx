// components/resume/skill-chip.tsx
"use client";

import { ArrowUp, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SkillChipProps {
  skill: string;
  onRemove: (skill: string) => void;
  onMoveToFront?: (skill: string) => void;
  className?: string;
}

export function SkillChip({ skill, onRemove, onMoveToFront, className }: SkillChipProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-11 max-w-full items-center gap-0.5 rounded-full bg-violet-light py-0.5 pl-3.5 pr-0.5 text-sm font-semibold text-violet-deep",
        className
      )}
    >
      <span className="min-w-0 wrap-anywherebreak-word">{skill}</span>
      {onMoveToFront ? (
        <button
          type="button"
          onClick={() => onMoveToFront(skill)}
          aria-label={`Move ${skill} to the front`}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-violet-deep transition-colors hover:bg-white/70"
        >
          <ArrowUp className="size-4" aria-hidden />
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => onRemove(skill)}
        aria-label={`Remove ${skill}`}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-violet-deep transition-colors hover:bg-white/70"
      >
        <X className="size-4" aria-hidden />
      </button>
    </span>
  );
}
