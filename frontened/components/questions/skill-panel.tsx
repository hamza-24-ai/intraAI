// components/questions/skill-panel.tsx
"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ExportActions } from "@/components/questions/export-actions";
import { QuestionAccordion } from "@/components/questions/question-accordion";
import { SkillEmptyState } from "@/components/questions/skill-empty-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { buildSetupHref } from "@/lib/interview-flow";
import {
  resolveRequestedSkill,
  skillPanelId,
  skillTabId,
  type FilteredQuestionSet,
} from "@/lib/question-bank-utils";
import type { Difficulty, QuestionSet } from "@/lib/schemas";
import { cn } from "@/lib/utils";

interface SkillPanelProps {
  set: FilteredQuestionSet;
  fullSet: QuestionSet;
  allSets: QuestionSet[];
  difficulty: Difficulty;
  targetRole: string | null;
  requestedSkills: string[];
  disabled: boolean;
  onRegenerate: () => void;
}

export function SkillPanel({
  set,
  fullSet,
  allSets,
  difficulty,
  targetRole,
  requestedSkills,
  disabled,
  onRegenerate,
}: SkillPanelProps) {
  const [openIds, setOpenIds] = useState<Set<number>>(() => new Set());

  const displaySkill = resolveRequestedSkill(set.skill, requestedSkills);
  const practiceHref = buildSetupHref({ skill: displaySkill, difficulty });
  const panelId = skillPanelId(displaySkill);
  const count = set.questions.length;
  const allOpen = count > 0 && set.questions.every((question) => openIds.has(question.originalIndex));

  const toggle = (originalIndex: number) => {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(originalIndex)) next.delete(originalIndex);
      else next.add(originalIndex);
      return next;
    });
  };

  const expandAll = () => setOpenIds(new Set(set.questions.map((question) => question.originalIndex)));
  const collapseAll = () => setOpenIds(new Set());

  return (
    <article id={panelId} role="tabpanel" aria-labelledby={skillTabId(displaySkill)}>
      <header>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-2xl font-bold text-ink md:text-3xl">{displaySkill}</h2>
            <p className="mt-1 text-sm text-slate-dark">
              {count} {count === 1 ? "question" : "questions"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={practiceHref}
              className={cn(buttonVariants({ size: "lg" }), "hidden md:inline-flex")}
            >
              Practice this skill live
              <ArrowRight aria-hidden />
            </Link>
            <ExportActions
              set={fullSet}
              sets={allSets}
              difficulty={difficulty}
              targetRole={targetRole}
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-11 px-3"
            onClick={expandAll}
            disabled={count === 0 || allOpen}
          >
            Expand all
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-11 px-3"
            onClick={collapseAll}
            disabled={openIds.size === 0}
          >
            Collapse all
          </Button>
          <Link
            href={buildSetupHref({ difficulty })}
            className="ml-auto inline-flex min-h-11 items-center text-sm font-semibold text-brand-violet underline-offset-4 hover:underline"
          >
            Practice all skills live
          </Link>
        </div>
      </header>

      {count === 0 ? (
        <div className="mt-4">
          <SkillEmptyState
            title="No questions for this skill yet"
            description="The search did not return questions for this skill. Try generating the bank again."
            actionLabel="Generate again"
            onAction={onRegenerate}
            disabled={disabled}
          />
        </div>
      ) : (
        <QuestionAccordion
          questions={set.questions}
          skill={displaySkill}
          practiceHref={practiceHref}
          openIds={openIds}
          onToggle={toggle}
        />
      )}

      <div className="sticky bottom-0 z-20 -mx-4 mt-6 bg-white/90 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-md md:hidden">
        <Link href={practiceHref} className={cn(buttonVariants({ size: "lg" }), "w-full")}>
          Practice this skill live
          <ArrowRight aria-hidden />
        </Link>
      </div>
    </article>
  );
}
