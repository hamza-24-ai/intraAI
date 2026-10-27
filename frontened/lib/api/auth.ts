// lib/api/auth.ts
import { api } from "@/lib/api/client";
import {
  loginResponseSchema,
  resendResponseSchema,
  signupResponseSchema,
  type LoginInput,
  type SignupPayload,
} from "@/lib/schemas";
import { useAuthStore } from "@/stores/auth-store";
import { useInterviewStore } from "@/stores/interview-store";
import { useQuestionBankStore } from "@/stores/question-bank-store";
import { useResumeStore } from "@/stores/resume-store";

export async function signup(payload: SignupPayload): Promise<string> {
  const { data } = await api.post("/auth/signup", payload);
  return signupResponseSchema.parse(data).message;
}

export async function resendVerification(email: string): Promise<string> {
  const { data } = await api.post("/auth/resend-verification", { email });
  return resendResponseSchema.parse(data).message;
}

export async function login(input: LoginInput) {
  const { data } = await api.post("/auth/login", input);
  const res = loginResponseSchema.parse(data);
  useAuthStore.getState().setSession({
    accessToken: res.access_token,
    refreshToken: res.refresh_token,
    user: { id: res.user_id, email: res.email },
  });
  return res;
}

// The backend has no /auth/logout yet, so this is client-side only.
export function logout() {
  useAuthStore.getState().clearSession();
  useResumeStore.getState().reset();
  useQuestionBankStore.getState().reset();
  useInterviewStore.getState().reset();
}