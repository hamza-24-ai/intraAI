// src/components/home/faq-section.tsx
"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";
import { Section } from "@/components/home/section";
import { FlowBorder } from "@/components/ui/flow-border";
import { Reveal } from "@/components/ui/reveal";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "Do I need an account?",
    a: "No. Everything works without logging in. An account only lets you save your interview history and reports.",
  },
  { q: "Which resume formats can I upload?", a: "PDF or DOCX, up to 5 MB." },
  { q: "How long is an interview?", a: "You choose: 15 or 30 minutes." },
  { q: "Which language is used?", a: "English only for now, both in the app and in the interviews." },
  {
    q: "How does the answer timer work?",
    a: "After a question, stay silent for 15 to 20 seconds and the AI moves on to the next one, like a real interviewer. Start speaking and the clock stops.",
  },
];

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  const uid = useId();
  const reduce = useReducedMotion();

  return (
    <FlowBorder radius={16} width={1.5} tone="deep" motion="hover" className="bg-white">
      <h3>
        <button
          type="button"
          id={`${uid}-btn`}
          aria-expanded={open}
          aria-controls={`${uid}-panel`}
          onClick={onToggle}
          className="flex min-h-14 w-full items-center justify-between gap-4 px-5 py-3 text-left text-base font-semibold focus-visible:outline-none md:text-lg"
        >
          {q}
          <ChevronDown
            className={cn("size-5 shrink-0 text-brand-violet transition-transform duration-300", open && "rotate-180")}
            aria-hidden
          />
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="panel"
            id={`${uid}-panel`}
            role="region"
            aria-labelledby={`${uid}-btn`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.35, ease: EASE }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-5 text-slate-dark">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </FlowBorder>
  );
}

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <Section tone="mint">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-[26px] font-bold leading-8.5 md:text-4xl md:leading-11">Questions, answered</h2>
      </Reveal>

      <Reveal className="mx-auto mt-10 max-w-3xl space-y-3 md:mt-14">
        {FAQS.map((item, i) => (
          <FaqItem
            key={item.q}
            {...item}
            open={openIndex === i}
            onToggle={() => setOpenIndex(openIndex === i ? null : i)}
          />
        ))}
      </Reveal>
    </Section>
  );
}