// lib/question-bank-utils.ts
import type { ContextPayload, QuestionSet } from "@/lib/schemas";

/** Stable identity of the resume/skills context a bank was generated from. */
export function makeContextKey(payload: ContextPayload): string {
  return JSON.stringify({
    resume_id: payload.resume_id ?? null,
    skills: payload.skills ?? [],
    target_role: payload.target_role ?? null,
  });
}

/** The backend writes skill names itself, so compare loosely. */
export function normalizeSkill(skill: string): string {
  return skill.toLowerCase().replace(/[^a-z0-9+#]/g, "");
}

export function findMissingSkills(requested: string[], sets: QuestionSet[]): string[] {
  if (sets.length >= requested.length) return [];
  const present = new Set(sets.map((set) => normalizeSkill(set.skill)));
  return requested.filter((skill) => !present.has(normalizeSkill(skill)));
}

/** Prefer the user's own spelling of a skill over the LLM's version. */
export function resolveRequestedSkill(setSkill: string, requested: string[]): string {
  const key = normalizeSkill(setSkill);
  return requested.find((skill) => normalizeSkill(skill) === key) ?? setSkill;
}

export interface FilteredQuestionSet extends QuestionSet {
  questions: (QuestionSet["questions"][number] & { originalIndex: number })[];
}

/** Case-insensitive substring match over question text; keeps original numbering. */
export function filterSets(sets: QuestionSet[], query: string): FilteredQuestionSet[] {
  const needle = query.trim().toLowerCase();
  return sets
    .map((set) => ({
      ...set,
      questions: set.questions
        .map((question, originalIndex) => ({ ...question, originalIndex }))
        .filter((question) => question.question_text.toLowerCase().includes(needle)),
    }))
    .filter((set) => needle.length === 0 || set.questions.length > 0);
}

export function slugifySkill(skill: string): string {
  const slug = skill
    .toLowerCase()
    .replace(/\+\+/g, "-plus-plus")
    .replace(/\+/g, "-plus")
    .replace(/#/g, "-sharp")
    .replace(/^\./, "dot")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "skill";
}

export function skillTabId(skill: string): string {
  return `skill-tab-${slugifySkill(skill)}`;
}

export function skillPanelId(skill: string): string {
  return `skill-panel-${slugifySkill(skill)}`;
}
