// components/resume/skills-editor.tsx
"use client";

import { AlertCircle } from "lucide-react";
import { useId, useState, type KeyboardEvent } from "react";
import { SkillChip } from "@/components/resume/skill-chip";
import { Button } from "@/components/ui/button";
import { FlowInput } from "@/components/ui/flow-input";
import { LIVE_INTERVIEW_SKILL_LIMIT, MAX_SKILLS } from "@/lib/constants";

interface SkillsEditorProps {
  skills: string[];
  onChange: (skills: string[]) => void;
  error?: string;
}

export function SkillsEditor({ skills, onChange, error }: SkillsEditorProps) {
  const [draft, setDraft] = useState("");
  const [announcement, setAnnouncement] = useState("");

  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [hintId, error ? errorId : null].filter(Boolean).join(" ");

  const addSkill = () => {
    const value = draft.trim();
    if (!value) return;
    if (value.length > 40) {
      setAnnouncement("Skills can be up to 40 characters.");
      return;
    }
    if (skills.some((skill) => skill.toLowerCase() === value.toLowerCase())) {
      setAnnouncement(`${value} is already in your list.`);
      setDraft("");
      return;
    }
    if (skills.length >= MAX_SKILLS) {
      setAnnouncement(`You can keep up to ${MAX_SKILLS} skills.`);
      return;
    }
    onChange([...skills, value]);
    setAnnouncement(`${value} added.`);
    setDraft("");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addSkill();
  };

  const removeSkill = (skill: string) => {
    onChange(skills.filter((item) => item !== skill));
    setAnnouncement(`${skill} removed.`);
  };

  const moveToFront = (skill: string) => {
    onChange([skill, ...skills.filter((item) => item !== skill)]);
    setAnnouncement(`${skill} moved to the front.`);
  };

  const liveSkills = skills.slice(0, LIVE_INTERVIEW_SKILL_LIMIT);
  const bankSkills = skills.slice(LIVE_INTERVIEW_SKILL_LIMIT);
  const grouped = skills.length > LIVE_INTERVIEW_SKILL_LIMIT;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-dark">
          Add a skill
        </label>
        <div className="flex gap-2">
          <FlowInput
            id={inputId}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            maxLength={40}
            placeholder="e.g. React"
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            disabled={skills.length >= MAX_SKILLS}
          />
          <Button
            type="button"
            className="h-12 shrink-0"
            onClick={addSkill}
            disabled={!draft.trim() || skills.length >= MAX_SKILLS}
          >
            Add
          </Button>
        </div>
        <p id={hintId} className="text-sm text-slate-dark">
          Live interviews use your first {LIVE_INTERVIEW_SKILL_LIMIT} skills. The Question Bank uses all of them.
        </p>
        {error ? (
          <p id={errorId} role="alert" className="flex items-start gap-1.5 text-sm font-medium text-error">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </p>
        ) : null}
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      {skills.length === 0 ? (
        <p className="rounded-xl bg-mint-soft px-4 py-3 text-sm text-slate-dark">
          No skills yet. Add at least one to continue.
        </p>
      ) : grouped ? (
        <div className="space-y-4">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-ink">Used in live interviews</h3>
            <ul className="flex flex-wrap gap-2" aria-label="Skills used in live interviews">
              {liveSkills.map((skill) => (
                <li key={skill}>
                  <SkillChip skill={skill} onRemove={removeSkill} />
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-ink">Question Bank only</h3>
            <ul className="flex flex-wrap gap-2" aria-label="Skills only used in the Question Bank">
              {bankSkills.map((skill) => (
                <li key={skill}>
                  <SkillChip skill={skill} onRemove={removeSkill} onMoveToFront={moveToFront} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-ink">Your skills</h3>
          <ul className="flex flex-wrap gap-2" aria-label="Your skills">
            {skills.map((skill) => (
              <li key={skill}>
                <SkillChip skill={skill} onRemove={removeSkill} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
