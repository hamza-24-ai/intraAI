// components/auth/form-banner.tsx
"use client";

import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FormBannerProps {
  tone: "error" | "success";
  children: ReactNode;
}

const TONE_STYLES = {
  error: "bg-error-tint text-error",
  success: "bg-mint text-emerald-dark",
} as const;

export function FormBanner({ tone, children }: FormBannerProps) {
  const Icon = tone === "error" ? AlertCircle : CheckCircle2;

  return (
    <motion.div
      role={tone === "error" ? "alert" : "status"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-medium",
        TONE_STYLES[tone]
      )}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="min-w-0 space-y-1">{children}</div>
    </motion.div>
  );
}
