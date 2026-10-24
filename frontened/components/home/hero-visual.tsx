// src/components/home/hero-visual.tsx
"use client";

import { AnimatePresence, motion, useAnimationFrame, useMotionValue, useReducedMotion } from "framer-motion";
import { Sparkles, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Orb } from "@/components/orb/orb";
import type { OrbState } from "@/components/orb/orb-types";
import { GlassCard } from "@/components/ui/glass-card";
import { useMediaQuery } from "@/hooks/use-media-query";
import { EASE, POP_SPRING } from "@/lib/motion";

const QUESTIONS = [
  "Explain how React's virtual DOM works.",
  "What is the difference between a process and a thread?",
  "How would you design a REST API for a library system?",
];

const CHIPS = [
  { label: "React", phase: 0.4, period: 46 },
  { label: "Python", phase: 2.5, period: 52 },
  { label: "C++", phase: 4.5, period: 40 },
];

const STAGE_BG =
  "radial-gradient(circle at 50% 45%, rgba(106,47,212,0.14), transparent 62%), linear-gradient(to bottom, #E6F8F1, #FFFFFF)";

function OrbitChip({
  label,
  phase,
  period,
  rx,
  ry,
  index,
}: {
  label: string;
  phase: number;
  period: number;
  rx: number;
  ry: number;
  index: number;
}) {
  const reduce = useReducedMotion();
  const x = useMotionValue(Math.cos(phase) * rx);
  const y = useMotionValue(Math.sin(phase) * ry);

  // slow elliptical orbit around the device frame; chips stay upright
  useAnimationFrame((t) => {
    if (reduce) return;
    const angle = (t / 1000 / period) * Math.PI * 2 + phase;
    x.set(Math.cos(angle) * rx);
    y.set(Math.sin(angle) * ry);
  });

  return (
    <motion.div style={{ x, y }} className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
      <motion.span
        initial={reduce ? false : { scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ ...POP_SPRING, delay: 0.7 + index * 0.15 }}
        className="block rounded-full bg-white px-4 py-2 font-mono text-sm font-medium text-brand-violet shadow-md"
      >
        {label}
      </motion.span>
    </motion.div>
  );
}

export function HeroVisual() {
  const reduce = useReducedMotion();
  const compact = useMediaQuery("(max-width: 599px)");
  const [cycle, setCycle] = useState(0);

  // idle <-> speaking every 3.5 s (idle with an occasional heartbeat demo)
  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setCycle((c) => c + 1), 3500);
    return () => window.clearInterval(id);
  }, [reduce]);

  const speaking = !reduce && cycle % 2 === 1;
  const state: OrbState = speaking ? "speaking" : "idle";
  const question = QUESTIONS[Math.floor(cycle / 2) % QUESTIONS.length];
  const blur = reduce ? "blur(0px)" : "blur(8px)";

  return (
    <motion.div
      aria-hidden
      initial={reduce ? false : { opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, ease: EASE, delay: 0.2 }}
      className="relative mx-auto w-full max-w-115"
    >
      {CHIPS.map((chip, i) => (
        <OrbitChip key={chip.label} {...chip} index={i} rx={compact ? 150 : 270} ry={compact ? 210 : 300} />
      ))}

      <GlassCard className="relative z-10 p-0">
        <div className="relative z-10 flex items-center justify-between rounded-t-[22px] bg-white px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="size-3 rounded-full bg-brand-emerald" />
            <span className="size-3 rounded-full bg-mid" />
            <span className="size-3 rounded-full bg-brand-violet" />
          </div>
          <span className="text-sm font-semibold">Live interview</span>
          <span className="font-mono text-sm text-slate-dark">Q4 · 12:45</span>
        </div>

        <div
          className="relative flex items-center justify-center"
          style={{ height: compact ? 340 : 460, background: STAGE_BG }}
        >
          <Orb state={state} size={compact ? 300 : 420} />
        </div>

        <div className="relative z-10 rounded-b-[22px] bg-white px-4 py-3">
          <div className="flex min-h-12 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-light text-brand-violet">
              {speaking ? <Volume2 className="size-5" /> : <Sparkles className="size-5" />}
            </span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={speaking ? `q-${cycle}` : "idle"}
                initial={{ opacity: 0, filter: blur }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: blur }}
                transition={{ duration: reduce ? 0.2 : 0.4 }}
                className="text-sm font-medium text-ink"
              >
                {speaking ? question : "Ready when you are."}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}