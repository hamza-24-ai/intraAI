// components/auth/resend-button.tsx
"use client";

import axios from "axios";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCooldown } from "@/hooks/use-cooldown";
import { resendVerification } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/client";
import { RESEND_COOLDOWN_SECONDS } from "@/lib/constants";
import { resendFormSchema } from "@/lib/schemas";

interface ResendButtonProps {
  email: string;
  autoStart?: boolean;
}

export function ResendButton({ email, autoStart = false }: ResendButtonProps) {
  const { remaining, active, start } = useCooldown(RESEND_COOLDOWN_SECONDS);
  const [sending, setSending] = useState(false);
  const wasActive = useRef(false);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (autoStart) start();
  }, [autoStart, start]);

  useEffect(() => {
    if (wasActive.current && !active) setAnnouncement("You can resend the email now.");
    wasActive.current = active;
  }, [active]);

  const handleResend = async () => {
    const parsed = resendFormSchema.safeParse({ email });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Enter a valid email");
      return;
    }

    setSending(true);
    try {
      await resendVerification(parsed.data.email);
      toast.success("Verification email sent.");
      start();
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      toast.error(getErrorMessage(error));
      if (status === 429) start();
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Button
        type="submit"
        variant="outline"
        size="lg"
        className="w-full"
        onClick={handleResend}
        disabled={active || sending}
        aria-busy={sending}
      >
        {sending ? <Loader2 className="animate-spin" aria-hidden /> : null}
        {active ? `Resend in ${remaining}s` : "Resend email"}
      </Button>
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
    </>
  );
}
