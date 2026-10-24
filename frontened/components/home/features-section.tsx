// src/components/home/features-section.tsx
import { ClipboardList, FileText, GraduationCap, Mic, Timer, TrendingUp } from "lucide-react";
import { Section } from "@/components/home/section";
import { FlowBorder } from "@/components/ui/flow-border";
import { Reveal } from "@/components/ui/reveal";

const FEATURES = [
  { icon: FileText, title: "Resume-aware questions", text: "Every question starts from your own skills and projects." },
  { icon: TrendingUp, title: "Adaptive difficulty", text: "Struggling? It eases off. Doing well? It digs deeper." },
  { icon: Mic, title: "Real voice interview", text: "Speak your answers out loud, just like the real thing." },
  { icon: Timer, title: "15 to 20 second answer timer", text: "Stay silent too long and it moves on, like a real interviewer." },
  { icon: ClipboardList, title: "Structured report", text: "Scores, strengths, weak spots and what to revise next." },
  { icon: GraduationCap, title: "Free for students", text: "No payment, and no login needed to practice." },
];

export function FeaturesSection() {
  return (
    <Section tone="mint">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-[26px] font-bold leading-8.5 md:text-4xl md:leading-11">
          Everything you need to get interview-ready
        </h2>
      </Reveal>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 md:mt-14 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, text }, i) => (
          <Reveal key={title} index={i} className="h-full">
            <FlowBorder radius={20} width={1.5} tone="deep" motion="hover" className="h-full bg-white p-6 shadow-sm">
              <span className="flex size-11 items-center justify-center rounded-xl bg-violet-light text-brand-violet">
                <Icon className="size-6" aria-hidden />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-1 text-slate-dark">{text}</p>
            </FlowBorder>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}