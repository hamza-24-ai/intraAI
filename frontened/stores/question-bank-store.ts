// stores/question-bank-store.ts
// In memory only (never persisted): a generated bank disappears on refresh.
import { create } from "zustand";
import type { Difficulty, QuestionSet } from "@/lib/schemas";

export interface QuestionBankEntry {
  questionSets: QuestionSet[];
  sessionId: number | null;
  saved: boolean;
  targetRole: string | null;
  generatedAt: number;
}

interface QuestionBankState {
  contextKey: string | null;
  banks: Partial<Record<Difficulty, QuestionBankEntry>>;
  activeDifficulty: Difficulty;
  exportedAt: number | null;
  ensureContext: (key: string) => void;
  setBank: (difficulty: Difficulty, entry: QuestionBankEntry) => void;
  setActiveDifficulty: (difficulty: Difficulty) => void;
  markExported: () => void;
  reset: () => void;
}

const initial = {
  contextKey: null,
  banks: {},
  activeDifficulty: "intermediate" as Difficulty,
  exportedAt: null,
};

export const useQuestionBankStore = create<QuestionBankState>()((set) => ({
  ...initial,

  ensureContext: (key) =>
    set((s) =>
      s.contextKey === key ? s : { contextKey: key, banks: {}, exportedAt: null }
    ),

  setBank: (difficulty, entry) =>
    set((s) => ({
      banks: { ...s.banks, [difficulty]: entry },
      activeDifficulty: difficulty,
    })),

  setActiveDifficulty: (difficulty) => set({ activeDifficulty: difficulty }),

  markExported: () => set({ exportedAt: Date.now() }),

  reset: () => set(initial),
}));
