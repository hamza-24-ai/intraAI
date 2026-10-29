// lib/resume-flow.ts
export type ResumeNext = "questions" | "interview";

// Only these two literals are accepted; anything else (including URLs) is ignored.
export function parseNext(raw: string | null | undefined): ResumeNext | null {
  return raw === "questions" || raw === "interview" ? raw : null;
}

export function pathAfterResume(next: ResumeNext | null): string {
  if (next === "questions") return "/questions";
  if (next === "interview") return "/interview/setup";
  return "/start";
}

export function withNext(path: string, next: ResumeNext | null): string {
  return next ? `${path}?next=${next}` : path;
}
