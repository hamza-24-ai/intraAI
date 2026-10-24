// src/components/home/orb-demo-section.tsx
"use client";

import { useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Section } from "@/components/home/section";
import { Orb } from "@/components/orb/orb";
import { OrbStatus } from "@/components/orb/orb-status";
import { FlowBorder } from "@/components/ui/flow-border";
import { Reveal } from "@/components/ui/reveal";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useMediaQuery } from "@/hooks/use-media-query";

const DEMO_STATES = ["speaking", "listening", "thinking"] as const;
type DemoState = (typeof DEMO_STATES)[number];

const OPTIONS: { value: DemoState; label: string }[] = [
  { value: "speaking", label: "AI speaking" },
  { value: "listening", label: "Listening" },
  { value: "thinking", label: "Thinking" },
];

const COPY: Record<DemoState, string> = {
  speaking: "The AI asks you a question out loud. The orb beats like a heartbeat while it talks.",
  listening:
    "Your turn. The orb calms down and waits. If you stay silent for 15 to 20 seconds, it moves on, like a real interview.",
  thinking: "After your answer, the AI weighs it and decides what to ask next.",
};

const STAGE_BG =
  "radial-gradient(circle at 50% 45%, rgba(106,47,212,0.12), transparent 62%), linear-gradient(to bottom, #E6F8F1, #FFFFFF)";

export function OrbDemoSection() {
  const reduce = useReducedMotion();
  const compact = useMediaQuery("(max-width: 599px)");
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const [state, setState] = useState<DemoState>("speaking");
  const [interacted, setInteracted] = useState(false);

  // auto-cycle every 4 s until the visitor touches the control
  useEffect(() => {
    if (reduce || interacted || !inView) return;
    const id = window.setInterval(
      () => setState((s) => DEMO_STATES[(DEMO_STATES.indexOf(s) + 1) % DEMO_STATES.length]),
      4000
    );
    return () => window.clearInterval(id);
  }, [reduce, interacted, inView]);

  return (
    <Section tone="white">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-[26px] font-bold leading-8.5 md:text-4xl md:leading-11">Meet the Orb</h2>
        <p className="mt-3 text-lg text-slate-dark">
          Your AI interviewer. You always know whether it is talking, listening or thinking.
        </p>
      </Reveal>

      <div ref={ref} className="mx-auto mt-10 max-w-3xl md:mt-14">
        <Reveal>
          <FlowBorder radius={32} width={2} className="shadow-lg">
            <div
              className="flex items-center justify-center rounded-[30px] py-12 md:py-16"
              style={{ background: STAGE_BG }}
            >
              <Orb state={state} size={compact ? 300 : 440} />
            </div>
          </FlowBorder>
        </Reveal>

        <div className="mt-8 flex flex-col items-center gap-5 text-center">
          <SegmentedControl
            ariaLabel="Preview an Orb state"
            options={OPTIONS}
            value={state}
            onChange={(v) => {
              setInteracted(true);
              setState(v);
            }}
          />
          <OrbStatus state={state} />
          <p className="max-w-xl text-lg text-slate-dark">{COPY[state]}</p>
        </div>
      </div>
    </Section>
  );
}