// components/resume/mode-card.tsx
"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { FlowBorder } from "@/components/ui/flow-border";
import { Reveal } from "@/components/ui/reveal";

interface ModeCardProps {
  href: string;
  title: string;
  description: string;
  note: string;
  icon: LucideIcon;
  index?: number;
}

export function ModeCard({ href, title, description, note, icon: Icon, index = 0 }: ModeCardProps) {
  const reduce = useReducedMotion();

  return (
    <Reveal index={index} className="h-full">
      <motion.div
        whileHover={reduce ? undefined : { y: -6 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="h-full"
      >
        <Link href={href} className="group block h-full rounded-3xl">
          <FlowBorder
            radius={24}
            width={2}
            motion="hover"
            className="h-full bg-white/85 shadow-md backdrop-blur-xl transition-shadow duration-200 group-hover:shadow-lg"
          >
            <div className="flex h-full flex-col gap-4 p-6">
              <span className="inline-flex size-12 items-center justify-center rounded-xl bg-violet-light text-brand-violet">
                <Icon className="size-6" aria-hidden />
              </span>
              <div className="space-y-1">
                <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
                <p className="text-base text-ink">{description}</p>
                <p className="text-sm text-slate-dark">{note}</p>
              </div>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-brand-violet">
                Choose
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
              </span>
            </div>
          </FlowBorder>
        </Link>
      </motion.div>
    </Reveal>
  );
}
