// components/questions/skill-empty-state.tsx
"use client";

import { MessageSquareX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SkillEmptyStateProps {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
}

export function SkillEmptyState({
  title,
  description,
  actionLabel,
  onAction,
  disabled = false,
}: SkillEmptyStateProps) {
  return (
    <div className="rounded-2xl bg-white/70 p-8 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-slate-light text-slate-dark">
        <MessageSquareX aria-hidden className="size-6" />
      </span>
      <h3 className="mt-3 font-display text-lg font-bold text-ink">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-dark">{description}</p>
      <Button variant="outline" className="mt-4 h-12" onClick={onAction} disabled={disabled}>
        {actionLabel}
      </Button>
    </div>
  );
}
