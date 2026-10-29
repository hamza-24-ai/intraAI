// src/components/home/step-visuals.tsx
"use client";

import { animate, motion, useReducedMotion } from "framer-motion";
import { BookOpen, Check, FileCheck, FileText, Mic, TrendingUp, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Orb } from "@/components/orb/orb";
import { FlowBorder } from "@/components/ui/flow-border";
import { useMediaQuery } from "@/hooks/use-media-query";
import { EASE, POP_SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ---------- 1. Upload ---------- */
export function UploadVisual() {
  const reduce = useReducedMotion();
  return (
    <div className="flex h-full items-center justify-center p-4">
      <FlowBorder radius={20} width={2} className="flex w-full max-w-sm items-center gap-4 bg-white p-5">
        <div className="relative flex size-14 shrink-0 items-center justify-center">
          <svg viewBox="0 0 56 56" className="absolute inset-0 -rotate-90">
            <circle cx="28" cy="28" r="24" fill="none" stroke="#E9EAEE" strokeWidth="4" />
            <motion.circle
              cx="28"
              cy="28"
              r="24"
              fill="none"
              stroke="#0A6B4A"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={150.8}
              initial={{ strokeDashoffset: reduce ? 0 : 150.8 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 1.2, ease: EASE, delay: 0.5 }}
            />
          </svg>
          <FileText className="size-6 text-brand-violet" aria-hidden />
        </div>
        <motion.div
          initial={reduce ? false : { x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <p className="font-semibold">Resume.pdf</p>
          <p className="text-sm text-slate-dark">Reading your resume</p>
        </motion.div>
      </FlowBorder>
    </div>
  );
}

/* ---------- 2. Skills ---------- */
const SKILLS = ["React", "Python", "FastAPI", "SQL", "C++"];

export function SkillsVisual() {
  const reduce = useReducedMotion();
  return (
    <div className="flex h-full flex-col justify-center gap-4 p-5">
      <div>
        <p className="mb-1 text-sm font-medium text-slate-dark">Target role</p>
        <FlowBorder
          radius={12}
          width={1.5}
          tone="deep"
          motion="hover"
          className="flex items-center justify-between gap-2 bg-white px-4 py-3"
        >
          <span className="font-semibold">Full Stack Developer</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-mint px-2 py-1 text-sm font-medium text-emerald-dark">
            <FileCheck className="size-4" aria-hidden /> From your resume
          </span>
        </FlowBorder>
      </div>
      <ul className="flex flex-wrap gap-2">
        {SKILLS.map((skill, i) => (
          <motion.li
            key={skill}
            initial={reduce ? false : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ...POP_SPRING, delay: 0.15 + i * 0.08 }}
            className="rounded-full bg-violet-light px-3 py-1.5 text-sm font-medium text-violet-deep"
          >
            {skill}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- 3. Mode ---------- */
function MiniMode({
  icon: Icon,
  title,
  selected,
}: {
  icon: typeof Mic;
  title: string;
  selected?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce || !selected ? false : { scale: 0.92 }}
      animate={{ scale: selected ? 1.04 : 1 }}
      transition={{ ...POP_SPRING, delay: 0.4 }}
      className="w-1/2 max-w-40"
    >
      <FlowBorder
        radius={16}
        width={2}
        tone="deep"
        motion={selected ? "always" : "hover"}
        className={cn("relative flex flex-col items-center gap-2 p-4 text-center", selected ? "bg-violet-light" : "bg-white")}
      >
        {selected && (
          <motion.span
            initial={reduce ? false : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ ...POP_SPRING, delay: 0.8 }}
            className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-brand-violet text-white"
          >
            <Check className="size-4" aria-hidden />
          </motion.span>
        )}
        <Icon className="size-7 text-brand-violet" aria-hidden />
        <span className="text-sm font-semibold">{title}</span>
      </FlowBorder>
    </motion.div>
  );
}

export function ModeVisual() {
  return (
    <div className="flex h-full items-center justify-center gap-3 p-4">
      <MiniMode icon={BookOpen} title="Question Bank" />
      <MiniMode icon={Mic} title="Live Interview" selected />
    </div>
  );
}

/* ---------- 4. Voice (Orb) ---------- */
export function VoiceVisual({ active }: { active: boolean }) {
  const reduce = useReducedMotion();
  const compact = useMediaQuery("(max-width: 599px)");
  const [replay, setReplay] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- replay key resets when the step becomes active
    if (active) setReplay((r) => r + 1);
  }, [active]);

  return (
    <div className="flex h-full items-center justify-center gap-4 p-4">
      <div className="flex shrink-0 items-center justify-center" style={{ width: compact ? 120 : 140 }}>
        <Orb state={active && !reduce ? "speaking" : "idle"} size={compact ? 120 : 140} />
      </div>

      <div className="flex min-w-0 max-w-55 flex-1 flex-col gap-3">
        <div className="flex items-start gap-2 rounded-2xl bg-white p-3 shadow-sm">
          <Volume2 className="mt-0.5 size-4 shrink-0 text-brand-violet" aria-hidden />
          <p className="text-sm font-medium">Explain how React&apos;s virtual DOM works.</p>
        </div>

        <div className="flex items-center gap-3">
          <svg viewBox="0 0 40 40" className="size-10 shrink-0 -rotate-90" aria-hidden>
            <circle cx="20" cy="20" r="16" fill="none" stroke="#E9EAEE" strokeWidth="4" />
            <motion.circle
              key={replay}
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="#0A6B4A"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={100.5}
              initial={{ strokeDashoffset: 0 }}
              animate={{ strokeDashoffset: reduce ? 0 : 100.5 }}
              transition={{ duration: 20, ease: "linear" }}
            />
          </svg>
          <p className="text-sm text-slate-dark">Moves on after 15 to 20 s of silence</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- 5. Report ---------- */
function useCountUp(target: number) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? target : 0);

  useEffect(() => {
    if (reduce) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- jump straight to the final score when motion is reduced
      setN(target);
      return;
    }
    const controls = animate(0, target, {
      duration: 1.2,
      delay: 0.3,
      ease: EASE,
      onUpdate: (v) => setN(Math.round(v)),
    });
    return () => controls.stop();
  }, [reduce, target]);

  return n;
}

const BARS = [
  { skill: "React", value: 82 },
  { skill: "Python", value: 74 },
  { skill: "C++", value: 61 },
];

export function ReportVisual() {
  const reduce = useReducedMotion();
  const score = useCountUp(78);
  const fraction = (score / 100) * 0.75; // 270 degree gauge

  return (
    <div className="flex h-full items-center justify-center gap-6 p-4">
      <div className="flex flex-col items-center gap-2">
        <div className="relative size-28">
          <svg viewBox="0 0 120 120" className="size-full" aria-hidden>
            <g transform="rotate(135 60 60)">
              <circle cx="60" cy="60" r="48" fill="none" stroke="#E9EAEE" strokeWidth="10" strokeLinecap="round" pathLength={1} strokeDasharray="0.75 1" />
              <circle cx="60" cy="60" r="48" fill="none" stroke="#6A2FD4" strokeWidth="10" strokeLinecap="round" pathLength={1} strokeDasharray={`${fraction} 1`} />
            </g>
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-display text-3xl font-bold">{score}</span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-mint px-3 py-1 text-sm font-semibold text-emerald-dark">
          <TrendingUp className="size-4" aria-hidden /> Strong
        </span>
      </div>

      <ul className="w-32 space-y-3 md:w-40">
        {BARS.map((bar, i) => (
          <li key={bar.skill}>
            <div className="flex justify-between text-sm font-medium">
              <span>{bar.skill}</span>
              <span className="font-mono">{bar.value}</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-slate-light">
              <motion.div
                className="h-2 rounded-full bg-brand-violet"
                initial={{ width: reduce ? `${bar.value}%` : "0%" }}
                animate={{ width: `${bar.value}%` }}
                transition={{ duration: 0.9, ease: EASE, delay: 0.4 + i * 0.12 }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}