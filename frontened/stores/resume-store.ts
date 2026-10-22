// stores/resume-store.ts
// In memory only (never persisted): anonymous users' data disappears on refresh, as designed.
import { create } from "zustand";
import type { ContextPayload, ParsedResume } from "@/lib/schemas";

interface ResumeState {
  fileName: string | null;
  resumeId: number | null; // null for anonymous users (nothing saved)
  saved: boolean;
  parsed: ParsedResume | null;
  needsManualRole: boolean;
  skillsEdited: boolean;
  setUploadResult: (r: {
    fileName: string;
    resumeId: number | null;
    saved: boolean;
    parsed: ParsedResume;
    needsManualRole: boolean;
  }) => void;
  setTargetRole: (role: string) => void;
  setSkills: (skills: string[]) => void;
  setManualInput: (input: { skills: string[]; targetRole: string | null }) => void;
  getContextPayload: () => ContextPayload | null;
  reset: () => void;
}

const initial = {
  fileName: null,
  resumeId: null,
  saved: false,
  parsed: null,
  needsManualRole: false,
  skillsEdited: false,
};

export const useResumeStore = create<ResumeState>()((set, get) => ({
  ...initial,

  setUploadResult: ({ fileName, resumeId, saved, parsed, needsManualRole }) =>
    set({ fileName, resumeId, saved, parsed, needsManualRole, skillsEdited: false }),

  setTargetRole: (role) =>
    set((s) => (s.parsed ? { parsed: { ...s.parsed, target_role: role.trim() || null }, needsManualRole: false } : s)),

  setSkills: (skills) =>
    set((s) => (s.parsed ? { parsed: { ...s.parsed, skills }, skillsEdited: true } : s)),

  // For users who type skills instead of uploading a resume
  setManualInput: ({ skills, targetRole }) =>
    set({
      fileName: null,
      resumeId: null,
      saved: false,
      needsManualRole: false,
      skillsEdited: true,
      parsed: {
        skills,
        target_role: targetRole,
        role_source: "manual",
        experience_level: "unknown",
        projects: [],
      },
    }),

  // Backend ignores `skills` when resume_id is sent, so only link the saved resume if skills are untouched.
  getContextPayload: () => {
    const { parsed, resumeId, skillsEdited } = get();
    if (!parsed || parsed.skills.length === 0) return null;
    const target_role = parsed.target_role ?? undefined;
    if (resumeId !== null && !skillsEdited) return { resume_id: resumeId, target_role };
    return { skills: parsed.skills, target_role };
  },

  reset: () => set(initial),
}));