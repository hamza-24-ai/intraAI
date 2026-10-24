// src/components/home/modes-section.tsx
"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, Check, Mic } from "lucide-react";
import Link from "next/link";
import { Section } from "@/components/home/section";
import { Button } from "@/components/ui/button";
import { FlowBorder } from "@/components/ui/flow-border";
import { Reveal } from "@/components/ui/reveal";

const MODES = [
  {
    icon: BookOpen,
    title: "Question Bank",
    blurb: "Study at your own pace.",
    bullets: [
      "A separate question set for every skill on your resume",
      "Questions tuned to Pakistani tech interviews",
      "Read and revise any time, no pressure",
    ],
    cta: "Start the Question Bank",
    href: "/resume?next=questions",
  },
  {
    icon: Mic,
    title: "Live Interview",
    blurb: "Speak with an AI interviewer.",
    bullets: [
      "The AI asks out loud and you answer by voice",
      "Difficulty adapts to how you are doing",
      "An honest report with your skill gaps at the end",
    ],
    cta: "Start a Live Interview",
    href: "/resume?next=interview",
  },
];

export function ModesSection() {
  const reduce = useReducedMotion();

  return (
    <Section tone="emerald">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-[26px] font-bold leading-8.5 md:text-4xl md:leading-11">Two ways to practice</h2>
        <p className="mt-3 text-lg">Study first, then test yourself. Or go straight to the interview.</p>
      </Reveal>

      <div className="mt-10 grid gap-6 md:mt-14 md:grid-cols-2 md:gap-8">
        {MODES.map(({ icon: Icon, title, blurb, bullets, cta, href }, i) => (
          <Reveal key={title} index={i} className="h-full">
            <motion.div whileHover={reduce ? undefined : { y: -6 }} transition={{ duration: 0.2 }} className="h-full">
              <FlowBorder
                radius={24}
                width={2}
                tone="deep"
                className="flex h-full flex-col bg-white p-6 shadow-lg md:p-8"
              >
                <span className="flex size-14 items-center justify-center rounded-2xl bg-violet-light text-brand-violet">
                  <Icon className="size-7" aria-hidden />
                </span>
                <h3 className="mt-5 text-2xl font-semibold">{title}</h3>
                <p className="mt-1 text-slate-dark">{blurb}</p>
                <ul className="mt-5 space-y-3">
                  {bullets.map((b) => (
                    <li key={b} className="flex items-start gap-3">
                      <Check className="mt-1 size-5 shrink-0 text-emerald-dark" aria-hidden />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="secondary" size="lg" className="mt-8 w-full md:mt-auto">
                  <Link href={href}>{cta}</Link>
                </Button>
              </FlowBorder>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}