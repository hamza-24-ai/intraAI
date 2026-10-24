// src/components/home/problem-section.tsx
import { ClipboardCheck, FileText, Mic } from "lucide-react";
import { Section } from "@/components/home/section";
import { FlowBorder } from "@/components/ui/flow-border";
import { Reveal } from "@/components/ui/reveal";

const GAPS = [
  {
    icon: Mic,
    title: "Practice gap",
    text: "Most students never rehearse out loud. Speaking under pressure is a skill of its own.",
  },
  {
    icon: FileText,
    title: "Personalization gap",
    text: "Generic question lists ignore your resume, your projects and the role you want.",
  },
  {
    icon: ClipboardCheck,
    title: "Feedback gap",
    text: 'Friends say "you did well." You need to know exactly what to fix.',
  },
];

export function ProblemSection() {
  return (
    <Section tone="mint">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-[26px] font-bold leading-8.5 md:text-4xl md:leading-11">
          Interviews are spoken. Your practice should be too.
        </h2>
      </Reveal>

      <div className="mt-10 grid gap-6 md:mt-14 md:grid-cols-3">
        {GAPS.map(({ icon: Icon, title, text }, i) => (
          <Reveal key={title} index={i} className="h-full">
            <FlowBorder radius={24} width={2} className="h-full bg-white p-6 shadow-md">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-violet-light text-brand-violet">
                <Icon className="size-6" aria-hidden />
              </span>
              <h3 className="mt-5 text-xl font-semibold md:text-2xl">{title}</h3>
              <p className="mt-2 text-slate-dark">{text}</p>
            </FlowBorder>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}