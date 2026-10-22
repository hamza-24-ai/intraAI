// src/lib/api/resumes.ts
import { api } from "@/lib/api/client";
import {
  resumeSchema,
  uploadResumeResponseSchema,
  validateResumeFile,
  type Resume,
  type UploadResumeResponse,
} from "@/lib/schemas";
import { useResumeStore } from "@/stores/resume-store";

export async function uploadResume(
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadResumeResponse> {
  const problem = validateResumeFile(file);
  if (problem) throw new Error(problem);

  const form = new FormData();
  form.append("file", file); // axios sets the multipart boundary itself

  const { data } = await api.post("/resumes/upload", form, {
    timeout: 90_000, // upload + parsing
    onUploadProgress: (e) => {
      if (e.total) onProgress?.(Math.round((e.loaded * 100) / e.total));
    },
  });

  const res = uploadResumeResponseSchema.parse(data);
  useResumeStore.getState().setUploadResult({
    fileName: file.name,
    resumeId: res.resume_id,
    saved: res.saved,
    parsed: res.parsed,
    needsManualRole: res.needs_manual_role_input,
  });
  return res;
}

export async function listResumes(): Promise<Resume[]> {
  const { data } = await api.get("/resumes");
  return resumeSchema.array().parse(data);
}

export async function getResume(id: number): Promise<Resume> {
  const { data } = await api.get(`/resumes/${id}`);
  return resumeSchema.parse(data);
}