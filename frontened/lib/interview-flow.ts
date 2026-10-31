// lib/interview-flow.ts
import type { ReadonlyURLSearchParams } from "next/navigation";
import { difficultySchema, type Difficulty } from "@/lib/schemas";
import { normalizeSkill } from "@/lib/question-bank-utils";

export function buildSetupHref({ skill, difficulty }: { skill?: string; difficulty?: Difficulty }): string {
  const params = new URLSearchParams();
  if (skill) params.set("skill", skill);
  if (difficulty) params.set("difficulty", difficulty);
  const query = params.toString();
  return query ? `/interview/setup?${query}` : "/interview/setup";
}

/** Only accept skills the user actually has, returned in their own spelling. */
export function parseSetupParams(
  params: URLSearchParams | ReadonlyURLSearchParams,
  knownSkills: string[]
): { skill: string | null; difficulty: Difficulty | null } {
  const rawSkill = params.get("skill");
  const skill = rawSkill
    ? (knownSkills.find((known) => normalizeSkill(known) === normalizeSkill(rawSkill)) ?? null)
    : null;

  const rawDifficulty = params.get("difficulty");
  const parsed = rawDifficulty ? difficultySchema.safeParse(rawDifficulty) : null;

  return { skill, difficulty: parsed?.success ? parsed.data : null };
}
