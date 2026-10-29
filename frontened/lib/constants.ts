

// lib/constants.ts
// Cosmetic countdown only. The real timer lives in the backend (ANSWER_TIMEOUT_SECONDS).
import type { ExperienceLevel } from "@/lib/schemas";


export const SILENCE_LIMIT_MS = 20_000;
export const MAX_RESUME_BYTES = 5 * 1024 * 1024;

export const RESEND_COOLDOWN_SECONDS = 60;
export const DEFAULT_AFTER_LOGIN = "/resume";

// Keep in sync with MAX_SKILLS_PER_INTERVIEW in the backend.
export const LIVE_INTERVIEW_SKILL_LIMIT = 4;
export const MAX_SKILLS = 30;

export const ROLE_SUGGESTIONS = [
  "Frontend Developer",
  "Full Stack Developer",
  "Backend Engineer",
  "Data Analyst",
  "Data Scientist",
  "AI/ML Engineer",
  "Mobile App Developer",
  "DevOps Engineer",
  "Software Engineer",
];

export const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "fresh_grad", label: "Fresh grad" },
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid" },
  { value: "senior", label: "Senior" },
];