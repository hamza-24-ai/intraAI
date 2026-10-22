// stores/interview-store.ts
import { create } from "zustand";
import type { FeedbackReport, InterviewConfig } from "@/lib/schemas";

export type InterviewPhase =
  | "idle"
  | "creating"      // POST /interview-sessions (pre-generating questions)
  | "connecting"    // WebSocket opening
  | "speaking"      // AI question playing
  | "listening"     // waiting for the user (silence clock running)
  | "userSpeaking"
  | "processing"    // answer sent, waiting for the server
  | "finished"
  | "error";

export type PromptKind = "intro" | "question" | "repeat";

export interface PromptEntry {
  kind: PromptKind;
  text: string;
  skill: string | null;
  at: number;
}

interface InterviewState {
  phase: InterviewPhase;
  config: InterviewConfig | null;
  sessionKey: string | null;
  dbSessionId: number | null;
  startedAt: number | null; // set when the first real question arrives
  currentPrompt: PromptEntry | null;
  questionNumber: number;
  history: PromptEntry[];   // intro + questions (repeats excluded)
  skippedCount: number;
  listeningStartedAt: number | null;
  ttsAvailable: boolean;
  micAvailable: boolean;
  notice: string | null;    // non-fatal server messages (e.g. "couldn't hear that")
  error: string | null;     // fatal
  report: FeedbackReport | null;
  endReason: string | null;
  reportDetail: string | null;

  setPhase: (p: InterviewPhase) => void;
  setConfig: (c: InterviewConfig) => void;
  setSession: (s: { sessionKey: string; dbSessionId: number | null }) => void;
  showPrompt: (p: { kind: PromptKind; text: string; skill: string | null }) => void;
  markListeningStarted: () => void;
  recordSkipped: () => void;
  setTtsAvailable: (v: boolean) => void;
  setMicAvailable: (v: boolean) => void;
  setNotice: (n: string | null) => void;
  setError: (e: string) => void;
  setReport: (r: FeedbackReport | null, endReason: string | null, detail: string | null) => void;
  reset: () => void;
}

const initial = {
  phase: "idle" as InterviewPhase,
  config: null,
  sessionKey: null,
  dbSessionId: null,
  startedAt: null,
  currentPrompt: null,
  questionNumber: 0,
  history: [] as PromptEntry[],
  skippedCount: 0,
  listeningStartedAt: null,
  ttsAvailable: true,
  micAvailable: true,
  notice: null,
  error: null,
  report: null,
  endReason: null,
  reportDetail: null,
};

export const useInterviewStore = create<InterviewState>()((set) => ({
  ...initial,

  setPhase: (phase) => set({ phase }),
  setConfig: (config) => set({ config }),
  setSession: ({ sessionKey, dbSessionId }) => set({ sessionKey, dbSessionId }),

  showPrompt: (p) =>
    set((s) => {
      const entry: PromptEntry = { ...p, at: Date.now() };
      return {
        currentPrompt: entry,
        notice: null,
        questionNumber: p.kind === "question" ? s.questionNumber + 1 : s.questionNumber,
        history: p.kind === "repeat" ? s.history : [...s.history, entry],
        startedAt: p.kind === "question" && s.startedAt === null ? Date.now() : s.startedAt,
      };
    }),

  markListeningStarted: () => set({ listeningStartedAt: Date.now() }),
  recordSkipped: () => set((s) => ({ skippedCount: s.skippedCount + 1 })),
  setTtsAvailable: (ttsAvailable) => set({ ttsAvailable }),
  setMicAvailable: (micAvailable) => set({ micAvailable }),
  setNotice: (notice) => set({ notice }),
  setError: (error) => set({ error, phase: "error" }),
  setReport: (report, endReason, reportDetail) =>
    set({ report, endReason, reportDetail, phase: "finished" }),

  reset: () => set(initial),
}));