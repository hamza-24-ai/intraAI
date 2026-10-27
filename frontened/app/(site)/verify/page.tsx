// app/(site)/verify/page.tsx
import type { Metadata } from "next";
import { VerifyView } from "@/components/auth/verify-view";

export const metadata: Metadata = {
  title: "Verify your email",
};

export default function VerifyPage() {
  return <VerifyView />;
}
