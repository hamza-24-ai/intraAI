

// lib/schemas.ts
import { z } from "zod";
import { MAX_RESUME_BYTES, MAX_SKILLS } from "@/lib/constants";

/* ---------- shared enums ---------- */
export const difficultySchema = z.enum(["beginner", "intermediate", "technical", "deep"]);
export const interviewTypeSchema = z.enum(["technical", "behavioral"]);
export const sessionModeSchema = z.enum(["question_bank", "live_interview"]);
export const sessionStatusSchema = z.enum(["in_progress", "completed", "abandoned"]);
export const durationSchema = z.union([z.literal(15), z.literal(30)]);
export const experienceLevelSchema = z.enum(["student", "fresh_grad", "junior", "mid", "senior"]);

export type Difficulty = z.infer<typeof difficultySchema>;
export type InterviewType = z.infer<typeof interviewTypeSchema>;
export type SessionStatus = z.infer<typeof sessionStatusSchema>;
export type ExperienceLevel = z.infer<typeof experienceLevelSchema>;

/* ---------- helpers (tolerant of LLM / nullable DB output) ---------- */
const stringList = z.array(z.string()).nullish().transform((v) => v ?? []);
const nullableRole = z
  .string()
  .nullish()
  .transform((v) => (v && v.trim() && v.trim().toLowerCase() !== "null" ? v.trim() : null));

/* ---------- auth ---------- */
export const loginFormSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginFormSchema>;

export const signupFormSchema = z
  .object({
    name: z.string().trim().min(2, "Name is too short"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type SignupForm = z.infer<typeof signupFormSchema>;
export type SignupPayload = Omit<SignupForm, "confirmPassword">;

export const resendFormSchema = z.object({
  email: z.string().email("Enter a valid email"),
});
export type ResendForm = z.infer<typeof resendFormSchema>;

export const resendResponseSchema = z.object({ message: z.string() });
export type ResendResponse = z.infer<typeof resendResponseSchema>;

export const signupResponseSchema = z.object({ message: z.string() });
export const loginResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.string(),
  user_id: z.string(),
  email: z.string(),
});

/* ---------- resumes ---------- */
// role_source / experience_level come from an LLM, so they stay plain strings.
export const parsedResumeSchema = z.object({
  skills: z.array(z.string()),
  target_role: nullableRole,
  role_source: z.string(),
  experience_level: z.string(),
  projects: z.array(z.string()),
});
export type ParsedResume = z.infer<typeof parsedResumeSchema>;

export const uploadResumeResponseSchema = z.object({
  saved: z.boolean(),
  resume_id: z.number().nullable(),
  parsed: parsedResumeSchema,
  needs_manual_role_input: z.boolean(),
});
export type UploadResumeResponse = z.infer<typeof uploadResumeResponseSchema>;

export const resumeSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  file_url: z.string(),
  parsed_skills: parsedResumeSchema.partial().nullable(),
  uploaded_at: z.string(),
});
export type Resume = z.infer<typeof resumeSchema>;

export function validateResumeFile(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext !== "pdf" && ext !== "docx") return "Only PDF and DOCX files are allowed.";
  if (file.size > MAX_RESUME_BYTES) return "File too large. Max 5 MB.";
  return null;
}

/* ---------- confirm details ---------- */
export const confirmFormSchema = z.object({
  target_role: z.string().trim().min(2, "Enter your target role").max(60, "Keep it under 60 characters"),
  experience_level: experienceLevelSchema,
  skills: z
    .array(z.string().trim().min(1).max(40))
    .min(1, "Add at least one skill")
    .max(MAX_SKILLS, "You can keep up to 30 skills"),
});
export type ConfirmForm = z.infer<typeof confirmFormSchema>;

/* ---------- context sent with question-bank / interview requests ---------- */
export const contextPayloadSchema = z.object({
  resume_id: z.number().int().optional(),
  skills: z.array(z.string().min(1)).optional(),
  target_role: z.string().optional(),
});
export type ContextPayload = z.infer<typeof contextPayloadSchema>;

/* ---------- question bank (Mode 1) ---------- */
export const generatedQuestionSchema = z.object({
  question_text: z.string(),
  difficulty_level: z.string(),
  answer_hint: z
    .string()
    .nullish()
    .transform((v) => v?.trim() || null),
});
export const questionSetSchema = z.object({
  skill: z.string(),
  questions: z.array(generatedQuestionSchema),
});
export type QuestionSet = z.infer<typeof questionSetSchema>;

export const generateQuestionsRequestSchema = contextPayloadSchema.extend({
  difficulty_level: difficultySchema,
});
export const generateQuestionsResponseSchema = z.object({
  saved: z.boolean(),
  session_id: z.number().nullable(),
  target_role: z.string().nullable(),
  question_sets: z.array(questionSetSchema),
});
export const sessionQuestionsResponseSchema = z.object({
  session_id: z.number(),
  questions_by_skill: z.record(
    z.string(),
    z.array(z.object({ id: z.number(), question_text: z.string(), difficulty_level: z.string() }))
  ),
});

/* ---------- interview sessions (Mode 2) ---------- */
export const interviewSetupFormSchema = z.object({
  interview_type: interviewTypeSchema,
  difficulty_level: difficultySchema,
  duration_minutes: durationSchema,
  audio_enabled: z.boolean(), // AI speaks the questions (TTS) when true
});
export type InterviewConfig = z.infer<typeof interviewSetupFormSchema>;

export const startInterviewRequestSchema = contextPayloadSchema.extend({
  interview_type: interviewTypeSchema,
  difficulty_level: difficultySchema,
  duration_minutes: durationSchema,
});
export const startInterviewResponseSchema = z.object({
  session_key: z.string(),
  db_session_id: z.number().nullable(),
  ws_path: z.string(),
});
export type StartInterviewResponse = z.infer<typeof startInterviewResponseSchema>;

export const interviewSessionSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  resume_id: z.number().nullable(),
  mode: sessionModeSchema,
  interview_type: interviewTypeSchema,
  difficulty_level: difficultySchema,
  duration_minutes: z.number().nullable(),
  status: sessionStatusSchema,
  started_at: z.string(),
  ended_at: z.string().nullable(),
});
export type InterviewSession = z.infer<typeof interviewSessionSchema>;

export const updateSessionRequestSchema = z.object({
  status: sessionStatusSchema.optional(),
  ended_at: z.string().optional(),
});
export type UpdateSessionInput = z.infer<typeof updateSessionRequestSchema>;

/* ---------- feedback ---------- */
export const feedbackReportSchema = z.object({
  overall_score: z.number(),
  strengths: stringList,
  weaknesses: stringList,
  skill_gap_notes: stringList,
  improvement_suggestions: stringList,
});
export type FeedbackReport = z.infer<typeof feedbackReportSchema>;

export const storedFeedbackReportSchema = feedbackReportSchema.extend({
  id: z.number(),
  session_id: z.number(),
  generated_at: z.string(),
});
export type StoredFeedbackReport = z.infer<typeof storedFeedbackReportSchema>;

/* ---------- live interview WebSocket ---------- */
const promptFields = { text: z.string(), skill: z.string().nullable().optional() };

export const wsServerMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("intro"), ...promptFields }),
  z.object({ type: z.literal("question"), ...promptFields }),
  z.object({ type: z.literal("repeat"), ...promptFields }),
  z.object({ type: z.literal("skipped") }),
  z.object({ type: z.literal("tts_unavailable") }),
  z.object({ type: z.literal("error"), detail: z.string() }),
  z.object({
    type: z.literal("report"),
    report: feedbackReportSchema.nullable(),
    end_reason: z.string().nullable().optional(),
    detail: z.string().nullable().optional(),
  }),
]);
export type WsServerMessage = z.infer<typeof wsServerMessageSchema>;

// Binary frames (a WAV utterance) are sent separately.
export type WsClientMessage =
  | { type: "playback_done" }
  | { type: "speech_start" }
  | { type: "speech_cancel" }
  | { type: "answer"; text: string }
  | { type: "end" };