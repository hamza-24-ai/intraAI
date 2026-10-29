// app/(site)/start/page.tsx
import type { Metadata } from "next";
import { ModeHub } from "@/components/resume/mode-hub";

export const metadata: Metadata = {
  title: "Choose a practice mode",
};

export default function StartPage() {
  return <ModeHub />;
}
