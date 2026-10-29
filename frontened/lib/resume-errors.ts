// lib/resume-errors.ts
import axios from "axios";
import { MAX_RESUME_BYTES } from "@/lib/constants";

export type UploadErrorKind =
  | "wrongType"
  | "tooLarge"
  | "empty"
  | "noText"
  | "parseFailed"
  | "network"
  | "timeout"
  | "server";

const VALID_EXTENSIONS = ["pdf", "docx"];

export function getResumeFileProblem(file: File): "wrongType" | "tooLarge" | "empty" | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!VALID_EXTENSIONS.includes(ext)) return "wrongType";
  if (file.size === 0) return "empty";
  if (file.size > MAX_RESUME_BYTES) return "tooLarge";
  return null;
}

function detailOf(error: unknown): string {
  if (!axios.isAxiosError<{ detail?: unknown }>(error)) return "";
  const detail = error.response?.data?.detail;
  return typeof detail === "string" ? detail.toLowerCase() : "";
}

export function classifyUploadError(error: unknown): UploadErrorKind {
  if (!axios.isAxiosError(error)) return "server";
  if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") return "timeout";
  if (!error.response) return "network";

  const status = error.response.status;
  const detail = detailOf(error);

  if (status === 413) return "tooLarge";
  if (status === 400 && detail.includes("unsupported file type")) return "wrongType";
  if (status === 422) return detail.includes("no readable text") ? "noText" : "parseFailed";
  return "server";
}

export const UPLOAD_ERROR_COPY: Record<UploadErrorKind, { title: string; hint?: string }> = {
  wrongType: { title: "We can only read PDF or DOCX files." },
  tooLarge: { title: "This file is over the size limit.", hint: "Maximum size is 5 MB." },
  empty: { title: "This file is empty." },
  noText: {
    title: "We could not read text from this file.",
    hint: "It may be a scan. Try exporting your resume as a text PDF or DOCX.",
  },
  parseFailed: { title: "We could not understand this resume layout." },
  network: { title: "Cannot reach the server.", hint: "Check your connection and try again." },
  timeout: { title: "This is taking longer than expected.", hint: "Please try again." },
  server: { title: "Something went wrong on our side. Please try again." },
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${Number.isInteger(mb) ? mb : mb.toFixed(1)} MB`;
}
