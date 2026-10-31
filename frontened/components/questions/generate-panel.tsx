// components/questions/generate-panel.tsx
"use client";

import { Sparkles } from "lucide-react";
import { SkillSelector } from "@/components/questions/skill-selector";
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
  skills: string[];
  selectedSkills: string[];
  onSelectionChange: (skills: string[]) => void;
}

export function GeneratePanel({
  value,
  onChange,
  completed,
  offline,
  onGenerate,
  skills,
  selectedSkills,
  onSelectionChange,
}: GeneratePanelProps) {
  const noSkills = selectedSkills.length === 0;

  return (
    <GlassCard className="mt-8 p-6 md:p-8">
      <h2 className="font-display text-xl font-bold text-ink md:text-2xl">Choose a difficulty</h2>
      <p className="mt-1 text-sm text-slate-dark">
        You can generate another difficulty later without losing this one.
      </p>

      <div className="mt-5">
        <DifficultyPicker value={value} onChange={onChange} completed={completed} />
      </div>

      <div className="mt-6">
        <SkillSelector skills={skills} selected={selectedSkills} onChange={onSelectionChange} />
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <p className="text-sm leading-relaxed text-slate-dark">
            We search for questions asked in Pakistani tech interviews, then write them for your
            skills. This can take up to a minute or two.
          </p>
          {noSkills ? (
            <p className="mt-2 text-sm font-medium text-warning">
              Select at least one skill to generate questions.
            </p>
          ) : null}
          {offline ? (
            <p className="mt-2 text-sm font-medium text-warning">
              You are offline. Reconnect to generate questions.
            </p>
          ) : null}
        </div>
        <Button
          size="lg"
          className="w-full sm:w-auto sm:min-w-56"
          onClick={onGenerate}
          disabled={offline || noSkills}
        >
          <Sparkles aria-hidden />
          Generate questions
        </Button>
      </div>
    </GlassCard>
  );
}
