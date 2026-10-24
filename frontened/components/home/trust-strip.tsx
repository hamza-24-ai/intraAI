// src/components/home/trust-strip.tsx
import { Gift, LockOpen, Mic, SlidersHorizontal } from "lucide-react";
import { Section } from "@/components/home/section";
import { Reveal } from "@/components/ui/reveal";

const ITEMS = [
  { icon: Gift, label: "Free" },
  { icon: LockOpen, label: "No login needed" },
  { icon: Mic, label: "Voice-first" },
  { icon: SlidersHorizontal, label: "Adaptive difficulty" },
];

export function TrustStrip() {
  return (
    <Section tone="white" className="py-8 md:py-10 lg:py-10" aria-label="Why students use IntraAI">
      {/* horizontal scroll chips on mobile, 4 columns from md up */}
      <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 scrollbar-none md:mx-0 md:grid md:grid-cols-4 md:gap-6 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
        {ITEMS.map(({ icon: Icon, label }, i) => (
          <li key={label} className="shrink-0 snap-start md:shrink">
            <Reveal index={i}>
              <div className="flex items-center gap-3 rounded-full bg-mint px-5 py-3 md:justify-center md:bg-transparent">
                <span className="flex size-10 items-center justify-center rounded-xl bg-violet-light text-brand-violet">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="whitespace-nowrap font-semibold">{label}</span>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  );
}