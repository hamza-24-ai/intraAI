// stores/question-bank-store.ts
import { create } from "zustand";
import type { Difficulty, QuestionSet } from "@/lib/schemas";

interface QuestionBankState {
  questionSets: QuestionSet[];
  sessionId: number | null;
  saved: boolean;
  targetRole: string | null;
  difficulty: Difficulty | null;
  setResult: (r: {
    questionSets: QuestionSet[];
    sessionId: number | null;
    saved: boolean;
    targetRole: string | null;
    difficulty: Difficulty;
  }) => void;
  reset: () => void;
}

const initial = { questionSets: [], sessionId: null, saved: false, targetRole: null, difficulty: null };

export const useQuestionBankStore = create<QuestionBankState>()((set) => ({
  ...initial,
  setResult: (r) => set(r),
  reset: () => set(initial),
}));