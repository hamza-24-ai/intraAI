// src/components/home/how-it-works.tsx
"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { useEffect, useState, type ComponentType } from "react";
import { Section } from "@/components/home/section";
import {
  ModeVisual,
  ReportVisual,
  SkillsVisual,
  UploadVisual,
  VoiceVisual,
} from "@/components/home/step-visuals";
import { Aurora } from "@/components/ui/aurora";
import { FlowBorder } from "@/components/ui/flow-border";
import { Reveal } from "@/components/ui/reveal";
import { useActiveStep } from "@/hooks/use-active-step";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface Step {
  title: string;
  text: string;
  Visual: ComponentType<{ active: boolean }>;
  remount: boolean; // remount the visual on activation to replay its entrance animation
}

const STEPS: Step[] = [
  {
    title: "Upload your resume",
    text: "Drop your PDF or DOCX. We read it in seconds.",
    Visual: UploadVisual,
    remount: true,
  },
  {
    title: "Check your skills",
    text: "We find your skills, projects and target role. Edit anything that looks off.",
    Visual: SkillsVisual,
    remount: true,
  },
  {
    title: "Pick how to practice",
    text: "Study a question bank for every skill, or jump into a live interview.",
    Visual: ModeVisual,
    remount: true,
  },
  {
    title: "Speak your answers",
    text: "Choose difficulty, type and time. The AI asks out loud and you answer by voice. Stay silent for 15 to 20 seconds and it moves on, like a real interview.",
    Visual: VoiceVisual,
    remount: false,
  },
  {
    title: "Get honest feedback",
    text: "See your score, strengths and weaknesses per skill and exactly what to improve. Create a free account only if you want to save it.",
    Visual: ReportVisual,
    remount: true,
  },
];

const ROW = 72; // px between rail nodes

function useReplayKey(active: boolean) {
  const [key, setKey] = useState(0);
  useEffect(() => {
    if (active) setKey((k) => k + 1);
  }, [active]);
  return key;
}

function HowTitle() {
  return (
    <>
      <h2 className="text-[26px] font-bold leading-8.5 md:text-4xl md:leading-11">How IntraAI works</h2>
      <p className="mt-3 text-lg text-slate-dark">Five steps from your resume to honest feedback.</p>
    </>
  );
}

function Rail({ active, onSelect }: { active: number; onSelect: (i: number) => void }) {
  return (
    <ol className="relative mt-10" aria-label="Steps">
      <span
        aria-hidden
        className="absolute left-5.5 top-5.5 w-0.5 -translate-x-1/2 bg-slate-light"
        style={{ height: ROW * (STEPS.length - 1) }}
      />
      <motion.span
        aria-hidden
        className="absolute left-5.5 top-5.5 w-0.5 -translate-x-1/2 bg-linear-to-b from-emerald-dark via-mid to-brand-violet"
        initial={false}
        animate={{ height: ROW * active }}
        transition={{ duration: 0.5, ease: EASE }}
      />
      {STEPS.map((step, i) => (
        <li key={step.title} style={{ height: ROW }} className="relative flex items-start gap-4">
          <button
            type="button"
            onClick={() => onSelect(i)}
            aria-current={i === active ? "step" : undefined}
            aria-label={`Go to step ${i + 1}: ${step.title}`}
            className={cn(
              "relative z-10 flex size-11 shrink-0 items-center justify-center rounded-full font-display font-bold transition-colors",
              i < active && "bg-emerald-dark text-white",
              i === active && "bg-brand-violet text-white shadow-md",
              i > active &&
                "flow-border flow-on-hover flow-deep bg-white text-ink [--flow-radius:9999px] [--flow-width:1.5px]"
            )}
          >
            {i < active ? <Check className="size-5" aria-hidden /> : i + 1}
          </button>
          <span className={cn("pt-2.5 font-semibold", i === active ? "text-ink" : "text-slate-dark")}>
            {step.title}
          </span>
        </li>
      ))}
    </ol>
  );
}

function VisualFrame({ active, children }: { active: boolean; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      aria-hidden
      // blur only while the visual crossfades in; it is always sharp once settled
      animate={!reduce && active ? { filter: ["blur(12px)", "blur(0px)"] } : { filter: "blur(0px)" }}
      transition={active ? { duration: 0.5, ease: EASE } : { duration: 0 }}
      className="relative h-56 overflow-hidden rounded-2xl bg-mint md:h-64"
    >
      {children}
    </motion.div>
  );
}

function StepCard({
  index,
  step,
  active,
  register,
}: {
  index: number;
  step: Step;
  active: boolean;
  register: (el: HTMLElement | null) => void;
}) {
  const reduce = useReducedMotion();
  const replay = useReplayKey(active);
  const { Visual } = step;

  return (
    <li
      ref={register}
      id={`step-${index + 1}`}
      data-step={index}
      className="list-none py-3 lg:flex lg:min-h-[62vh] lg:items-center lg:py-0"
    >
      <Reveal className="w-full">
        <motion.div
          animate={reduce ? undefined : { scale: active ? 1 : 0.97 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          <FlowBorder
            radius={24}
            width={2}
            motion={active ? "always" : "hover"}
            className="bg-white/90 shadow-md backdrop-blur-xl"
          >
            <div className="space-y-5 p-5 md:p-7">
              <VisualFrame active={active}>
                <Visual key={step.remount ? replay : "static"} active={active} />
              </VisualFrame>
              <div>
                <p className="font-mono text-sm font-medium text-brand-violet">
                  Step {index + 1} of {STEPS.length}
                </p>
                <h3 className="mt-1 text-xl font-semibold md:text-2xl">{step.title}</h3>
                <p className="mt-2 text-lg text-slate-dark">{step.text}</p>
              </div>
            </div>
          </FlowBorder>
        </motion.div>
      </Reveal>
    </li>
  );
}

export function HowItWorks() {
  const reduce = useReducedMotion();
  const { active, register } = useActiveStep(STEPS.length);

  const goTo = (i: number) =>
    document
      .getElementById(`step-${i + 1}`)
      ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });

  return (
    <Section id="how-it-works" tone="white">
      <Aurora className="opacity-70 mask-[radial-gradient(circle_at_100%_0%,black,transparent_60%)]" />

      {/* mobile: title, then a progress bar pinned under the navbar */}
      <div className="lg:hidden">
        <Reveal>
          <HowTitle />
        </Reveal>
      </div>
      <div className="sticky top-[calc(4.5rem+env(safe-area-inset-top))] z-20 -mx-4 my-6 bg-white/85 py-3 backdrop-blur-xl lg:hidden">
        <div aria-hidden className="flex items-center justify-center gap-2">
          {STEPS.map((step, i) => (
            <span
              key={step.title}
              className={cn(
                "h-2.5 rounded-full transition-all duration-300",
                i === active ? "w-6 bg-brand-violet" : i < active ? "w-2.5 bg-emerald-dark" : "w-2.5 bg-brand-gray"
              )}
            />
          ))}
        </div>
        <p className="sr-only" aria-live="polite">
          Step {active + 1} of {STEPS.length}: {STEPS[active].title}
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        {/* desktop: pinned title + rail */}
        <div className="hidden lg:col-span-5 lg:block">
          <div className="lg:sticky lg:top-28">
            <HowTitle />
            <Rail active={active} onSelect={goTo} />
          </div>
        </div>

        <ol className="space-y-4 lg:col-span-7 lg:space-y-0">
          {STEPS.map((step, i) => (
            <StepCard key={step.title} index={i} step={step} active={i === active} register={register(i)} />
          ))}
        </ol>
      </div>
    </Section>
  );
}