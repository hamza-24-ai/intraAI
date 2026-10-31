// lib/api/questions.ts
import { api } from "@/lib/api/client";
import {
  generateQuestionsRequestSchema,
  generateQuestionsResponseSchema,
  sessionQuestionsResponseSchema,
  type Difficulty,
} from "@/lib/schemas";
import { makeContextKey } from "@/lib/question-bank-utils";
import { useQuestionBankStore } from "@/stores/question-bank-store";
import { useResumeStore } from "@/stores/resume-store";

export async function generateQuestionBank(difficulty: Difficulty, signal?: AbortSignal) {
  const context = useResumeStore.getState().getContextPayload();
  if (!context) throw new Error("Upload your resume (or add your skills) first.");

  const payload = generateQuestionsRequestSchema.parse({ ...context, difficulty_level: difficulty });
  useQuestionBankStore.getState().ensureContext(makeContextKey(payload));

  const { data } = await api.post("/questions/generate", payload, { timeout: 120_000, signal }); // Tavily + LLM per skill
  const res = generateQuestionsResponseSchema.parse(data);

  useQuestionBankStore.getState().setBank(difficulty, {
    questionSets: res.question_sets,
    sessionId: res.session_id,
    saved: res.saved,
    targetRole: res.target_role,
    generatedAt: Date.now(),
  });
  return res;
}

export async function getSessionQuestions(sessionId: number) {
  const { data } = await api.get(`/questions/${sessionId}`);
  return sessionQuestionsResponseSchema.parse(data);
}
