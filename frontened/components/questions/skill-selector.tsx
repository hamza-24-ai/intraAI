// components/questions/skill-selector.tsx
"use client";

import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FlowBorder } from "@/components/ui/flow-border";
import { MAX_SELECTED_SKILLS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface SkillSelectorProps {
  skills: string[];
  selected: string[];
  onChange: (skills: string[]) => void;
}

export function SkillSelector({ skills, selected, onChange }: SkillSelectorProps) {
  const atLimit = selected.length >= MAX_SELECTED_SKILLS;
  const hasMoreThanLimit = skills.length > MAX_SELECTED_SKILLS;
  const [announcement, setAnnouncement] = useState("");
  const interactedRef = useRef(false);

  useEffect(() => {
    if (!interactedRef.current) return;
    const timer = setTimeout(() => {
      setAnnouncement(`${selected.length} of ${MAX_SELECTED_SKILLS} skills selected.`);
    }, 400);
    return () => clearTimeout(timer);
  }, [selected.length]);

  const commit = (next: string[]) => {
    interactedRef.current = true;
    onChange(next);
  };

  const toggle = (skill: string) => {
    if (selected.includes(skill)) {
      commit(selected.filter((item) => item !== skill));
      return;
    }
    if (atLimit) return;
    commit([...selected, skill]);
  };

  return (
    <FlowBorder as="div" radius={20} motion="hover" className="bg-white p-5 md:p-6">
      <div role="group" aria-labelledby="skill-selector-heading">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 id="skill-selector-heading" className="font-display text-lg font-bold text-ink">
              Choose skills
            </h3>
            <p className="mt-1 text-sm text-slate-dark">
              Select up to {MAX_SELECTED_SKILLS} skills. We will write questions for each one.
            </p>
          </div>
          <p className="rounded-full bg-violet-light px-3 py-1 text-sm font-semibold text-violet-deep">
            {selected.length} of {MAX_SELECTED_SKILLS} selected
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 px-4"
            onClick={() => commit(skills.slice(0, MAX_SELECTED_SKILLS))}
          >
            Select all
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-11 px-4"
            onClick={() => commit([])}
            disabled={selected.length === 0}
          >
            Clear
          </Button>
        </div>

        <ul className="mt-3 grid gap-1 sm:grid-cols-2">
          {skills.map((skill) => {
            const checked = selected.includes(skill);
            const unavailable = !checked && atLimit;

            return (
              <li key={skill}>
                <label
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-xl px-3 py-1.5 text-base",
                    unavailable
                      ? "cursor-not-allowed text-slate-dark"
                      : "cursor-pointer text-ink hover:bg-violet-light"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={unavailable}
                    onChange={() => toggle(skill)}
                    className="size-5 shrink-0 accent-violet-deep disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  <span className="min-w-0 break-words">{skill}</span>
                  {checked ? (
                    <>
                      <Check aria-hidden className="ml-auto size-4 shrink-0 text-violet-deep" />
                      <span className="sr-only">selected</span>
                    </>
                  ) : null}
                </label>
              </li>
            );
          })}
        </ul>

        {atLimit && hasMoreThanLimit ? (
          <p className="mt-3 text-sm font-medium text-slate-dark">
            You have reached the {MAX_SELECTED_SKILLS}-skill limit. Uncheck a skill to choose a
            different one.
          </p>
        ) : null}

        <p role="status" aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </div>
    </FlowBorder>
  );
}
