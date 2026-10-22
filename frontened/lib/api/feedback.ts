// src/lib/api/feedback.ts
import { api } from "@/lib/api/client";
import { storedFeedbackReportSchema, type StoredFeedbackReport } from "@/lib/schemas";

export async function listFeedback(): Promise<StoredFeedbackReport[]> {
  const { data } = await api.get("/feedback");
  return storedFeedbackReportSchema.array().parse(data);
}

export async function getFeedback(sessionId: number): Promise<StoredFeedbackReport> {
  const { data } = await api.get(`/feedback/${sessionId}`);
  return storedFeedbackReportSchema.parse(data);
}