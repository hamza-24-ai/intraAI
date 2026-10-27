// components/auth/submit-button.tsx
"use client";

import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SubmitButtonProps {
  loading?: boolean;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}

export function SubmitButton({ loading = false, disabled, children, className }: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      size="lg"
      disabled={loading || disabled}
      aria-busy={loading}
      className={cn("relative w-full", className)}
    >
      <span className={cn("inline-flex items-center justify-center", loading && "invisible")}>
        {children}
      </span>
      {loading ? <Loader2 className="absolute size-5 animate-spin" aria-hidden /> : null}
    </Button>
  );
}
