// src/lib/api/sessions.ts
import { api } from "@/lib/api/client";
import {
  interviewSessionSchema,
  startInterviewRequestSchema,
  startInterviewResponseSchema,
  updateSessionRequestSchema,
  type InterviewConfig,
  type InterviewSession,
  type StartInterviewResponse,
  type UpdateSessionInput,
} from "@/lib/schemas";
import { useResumeStore } from "@/stores/resume-store";

export async function startInterview(config: InterviewConfig): Promise<StartInterviewResponse> {
  const context = useResumeStore.getState().getContextPayload();
  if (!context) throw new Error("Upload your resume (or add your skills) first.");

  const payload = startInterviewRequestSchema.parse({
    interview_type: config.interview_type,
    difficulty_level: config.difficulty_level,
    duration_minutes: config.duration_minutes,
    ...context,
  });
  const { data } = await api.post("/interview-sessions", payload, { timeout: 120_000 }); // questions are pre-generated here
  return startInterviewResponseSchema.parse(data);
}

export async function listSessions(): Promise<InterviewSession[]> {
  const { data } = await api.get("/interview-sessions");
  return interviewSessionSchema.array().parse(data);
}

export async function getSession(id: number): Promise<InterviewSession> {
  const { data } = await api.get(`/interview-sessions/${id}`);
  return interviewSessionSchema.parse(data);
}

export async function updateSession(id: number, input: UpdateSessionInput): Promise<InterviewSession> {
  const payload = updateSessionRequestSchema.parse(input);
  const { data } = await api.patch(`/interview-sessions/${id}`, payload);
  return interviewSessionSchema.parse(data);
}