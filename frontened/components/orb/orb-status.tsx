"use client";

import { useEffect, useRef } from "react";
import type { MutableRefObject } from "react";
import { ORB_STATE_META, type OrbState } from "@/components/orb/orb-types";
import { cn } from "@/lib/utils";

interface OrbStatusProps {
  state: OrbState;
  countdownSeconds?: number | null;
  questionNumber?: number;
  levelRef?: MutableRefObject<number>;
  className?: string;
}

export function OrbStatus({
  state,
  countdownSeconds = null,
  questionNumber,
  levelRef,
  className,
}: OrbStatusProps) {
  const meta = ORB_STATE_META[state];
  const Icon = meta.icon;
  const meterRef = useRef<HTMLSpanElement>(null);

  const label =
    state === "speaking" && questionNumber && questionNumber > 0
      ? `AI is asking question ${questionNumber}`
      : meta.label;

  let liveMessage = "";
  if (state === "speaking") {
    liveMessage =
      questionNumber && questionNumber > 0
        ? `AI is asking question ${questionNumber}`
        : "AI is asking";
  } else if (state === "listening" || state === "userSpeaking") {
    liveMessage = "Your turn";
  }
  if (countdownSeconds !== null && countdownSeconds <= 10 && countdownSeconds > 5) {
    liveMessage = "10 seconds left";
  } else if (countdownSeconds !== null && countdownSeconds <= 5 && countdownSeconds > 0) {
    liveMessage = "Moving to the next question";
  }

  useEffect(() => {
    if (state !== "userSpeaking" || !levelRef) return;
    const el = meterRef.current;
    if (!el) return;
    let raf = 0;
    const loop = () => {
      const v = Math.max(0, Math.min(1, levelRef.current));
      el.style.transform = `scaleX(${0.08 + v * 0.92})`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [state, levelRef]);

  const showCountdown = countdownSeconds !== null && countdownSeconds <= 10;
  const urgent = countdownSeconds !== null && countdownSeconds <= 5;
  const countdownText =
    urgent && countdownSeconds !== null
      ? `Moving on in ${Math.max(1, countdownSeconds)}`
      : showCountdown
        ? String(countdownSeconds)
        : null;

  return (
    <div className={cn("flex flex-col items-center gap-2 text-center", className)}>
      <p className="flex items-center gap-2 text-base font-semibold text-ink">
        <Icon
          className={cn(
            "size-5 shrink-0 text-violet-deep",
            state === "thinking" && "animate-spin",
            state === "listening" && "animate-pulse",
            state === "error" && "text-warning"
          )}
          aria-hidden="true"
        />
        <span>
          {label}
          {state === "thinking" ? <ThinkingDots /> : null}
        </span>
      </p>
      {state === "userSpeaking" ? (
        <span
          className="flex h-1.5 w-28 overflow-hidden rounded-full bg-slate-light"
          aria-hidden="true"
        >
          <span
            ref={meterRef}
            className="h-full w-full origin-left rounded-full bg-emerald-dark"
            style={{ transform: "scaleX(0.08)" }}
          />
        </span>
      ) : null}
      {countdownText ? (
        <p
          className={cn(
            "font-mono text-lg font-semibold tabular-nums",
            urgent ? "text-warning" : "text-emerald-dark"
          )}
        >
          {countdownText}
        </p>
      ) : null}
      <span className="sr-only" aria-live="polite">
        {liveMessage}
      </span>
    </div>
  );
}

function ThinkingDots() {
  return (
    <span className="ml-0.5 inline-flex w-6 justify-between" aria-hidden="true">
      <span className="animate-bounce [animation-delay:0ms]">.</span>
      <span className="animate-bounce [animation-delay:120ms]">.</span>
      <span className="animate-bounce [animation-delay:240ms]">.</span>
    </span>
  );
}
