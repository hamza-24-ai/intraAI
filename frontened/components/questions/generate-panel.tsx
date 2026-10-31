// components/questions/generate-panel.tsx
"use client";

import { Sparkles } from "lucide-react";
import { DifficultyPicker } from "@/components/shared/difficulty-picker";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import type { Difficulty } from "@/lib/schemas";

interface GeneratePanelProps {
  value: Difficulty;
  onChange: (value: Difficulty) => void;
  completed: Difficulty[];
  offline: boolean;
  onGenerate: () => void;
}

export function GeneratePanel({ value, onChange, completed, offline, onGenerate }: GeneratePanelProps) {
  return (
    <GlassCard className="mt-8 p-6 md:p-8">
      <h2 className="font-display text-xl font-bold text-ink md:text-2xl">Choose a difficulty</h2>
      <p className="mt-1 text-sm text-slate-dark">
        You can generate another difficulty later without losing this one.
      </p>

      <div className="mt-5">
        <DifficultyPicker value={value} onChange={onChange} completed={completed} />
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl text-sm leading-relaxed text-slate-dark">
          We search for questions asked in Pakistani tech interviews, then write them for your skills. This can
          take up to a minute or two.
        </p>
        <Button size="lg" className="w-full sm:w-auto sm:min-w-56" onClick={onGenerate} disabled={offline}>
          <Sparkles aria-hidden />
          Generate questions
        </Button>
      </div>
    </GlassCard>
  );
}
