// components/questions/question-accordion.tsx
"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronDown, Lightbulb, Mic } from "lucide-react";
import Link from "next/link";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { FlowBorder } from "@/components/ui/flow-border";
import { Reveal } from "@/components/ui/reveal";
import { skillPanelId, type FilteredQuestionSet } from "@/lib/question-bank-utils";
import { cn } from "@/lib/utils";

interface QuestionAccordionProps {
  questions: FilteredQuestionSet["questions"];
  skill: string;
  practiceHref: string;
  openIds: Set<number>;
  onToggle: (originalIndex: number) => void;
}

export function QuestionAccordion({
  questions,
  skill,
  practiceHref,
  openIds,
  onToggle,
}: QuestionAccordionProps) {
  const reduce = useReducedMotion();
  const headingPrefix = skillPanelId(skill);

  return (
    <div className="mt-4 space-y-3">
      {questions.map((question, index) => {
        const open = openIds.has(question.originalIndex);
        const buttonId = `${headingPrefix}-q-${question.originalIndex}-button`;
        const regionId = `${headingPrefix}-q-${question.originalIndex}-region`;

        return (
          <Reveal key={question.originalIndex} index={index}>
            <FlowBorder radius={16} width={1.5} motion="hover" className="bg-white/90">
              <article>
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={open}
                    aria-controls={regionId}
                    onClick={() => onToggle(question.originalIndex)}
                    className="flex min-h-12 w-full items-start gap-3 rounded-2xl p-4 text-left"
                  >
                    <span
                      aria-hidden
                      className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-light text-xs font-bold text-slate-dark"
                    >
                      {question.originalIndex + 1}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block text-base font-semibold leading-relaxed text-ink",
                          !open && "line-clamp-2"
                        )}
                      >
                        {question.question_text}
                      </span>
                      <span className="mt-2 flex flex-wrap items-center gap-2">
                        <DifficultyBadge difficulty={question.difficulty_level} />
                      </span>
                    </span>

                    <ChevronDown
                      aria-hidden
                      className={cn(
                        "mt-0.5 size-5 shrink-0 text-slate-dark transition-transform duration-200",
                        open && "rotate-180"
                      )}
                    />
                  </button>
                </h3>

                <AnimatePresence initial={false}>
                  {open ? (
                    <motion.div
                      key="content"
                      id={regionId}
                      role="region"
                      aria-labelledby={buttonId}
                      initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                      animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                      exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                      transition={{ duration: reduce ? 0.2 : 0.25, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 px-4 pb-4 pl-15">
                        {question.answer_hint ? (
                          <div className="rounded-xl bg-mint-soft p-4">
                            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                              <Lightbulb aria-hidden className="size-4 text-emerald-dark" />
                              What a strong answer covers
                            </p>
                            <p className="mt-1 text-sm leading-relaxed text-slate-dark">
                              {question.answer_hint}
                            </p>
                          </div>
                        ) : (
                          <div className="rounded-xl bg-violet-light p-4">
                            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                              <Mic aria-hidden className="size-4 text-violet-deep" />
                              Practice answering this out loud
                            </p>
                            <p className="mt-1 text-sm leading-relaxed text-slate-dark">
                              The live interview will ask questions like this one.
                            </p>
                          </div>
                        )}

                        <Link
                          href={practiceHref}
                          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-brand-violet underline-offset-4 hover:underline"
                        >
                          Practice this question live
                          <ArrowRight aria-hidden className="size-4" />
                        </Link>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </article>
            </FlowBorder>
          </Reveal>
        );
      })}
    </div>
  );
}
