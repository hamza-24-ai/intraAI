"use client";

import { useEffect, useRef, useState } from "react";
import { Orb } from "@/components/orb/orb";
import { OrbStatus } from "@/components/orb/orb-status";
import { DEFAULT_ORB_SIZE, type OrbState } from "@/components/orb/orb-types";
import { useAnalyserLevel } from "@/hooks/use-analyser-level";
import { useMicLevel } from "@/hooks/use-mic-level";
import { SILENCE_LIMIT_MS } from "@/lib/constants";
import { useInterviewStore, type InterviewPhase } from "@/stores/interview-store";
import { cn } from "@/lib/utils";

function phaseToOrbState(phase: InterviewPhase, aiAudioPlaying: boolean): OrbState {
  switch (phase) {
    case "idle":
      return "idle";
    case "creating":
    case "connecting":
    case "processing":
      return "thinking";
    case "speaking":
      return aiAudioPlaying ? "speaking" : "idle";
    case "listening":
      return "listening";
    case "userSpeaking":
      return "userSpeaking";
    case "finished":
      return "wrapup";
    case "error":
      return "error";
  }
}

interface LiveOrbProps {
  getAiAnalyser: () => AnalyserNode | null;
  size?: number;
  className?: string;
}

export function LiveOrb({ getAiAnalyser, size = DEFAULT_ORB_SIZE, className }: LiveOrbProps) {
  const phase = useInterviewStore((s) => s.phase);
  const aiAudioPlaying = useInterviewStore((s) => s.aiAudioPlaying);
  const questionNumber = useInterviewStore((s) => s.questionNumber);
  const orbState = phaseToOrbState(phase, aiAudioPlaying);

  const micOn = phase === "listening" || phase === "userSpeaking";
  const aiOn = orbState === "speaking";
  const micLevel = useMicLevel(micOn);
  const aiLevel = useAnalyserLevel(getAiAnalyser, aiOn);
  const levelRef = orbState === "speaking" ? aiLevel : micLevel;

  const countdownRef = useRef<number | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const { phase: p, listeningStartedAt } = useInterviewStore.getState();
      if (p === "listening" && listeningStartedAt !== null) {
        countdownRef.current = Math.max(0, SILENCE_LIMIT_MS - (Date.now() - listeningStartedAt));
      } else {
        countdownRef.current = null;
      }
      const ms = countdownRef.current;
      const sec = ms === null ? null : Math.max(0, Math.ceil(ms / 1000));
      setCountdownSeconds((prev) => (prev === sec ? prev : sec));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <Orb
        state={orbState}
        size={size}
        levelRef={levelRef}
        countdownRef={countdownRef}
        countdownTotalMs={SILENCE_LIMIT_MS}
      />
      <OrbStatus
        state={orbState}
        countdownSeconds={countdownSeconds}
        questionNumber={questionNumber}
        levelRef={levelRef}
      />
    </div>
  );
}
