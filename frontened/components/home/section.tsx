// src/components/home/section.tsx
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "mint" | "white" | "emerald" | "violet";

const TONE: Record<Tone, string> = {
  mint: "bg-mint",
  white: "bg-white",
  emerald: "bg-brand-emerald text-ink",
  violet: "bg-brand-violet text-white",
};

interface SectionProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  tone?: Tone;
  containerClassName?: string;
  children: ReactNode;
}

export function Section({ tone = "white", containerClassName, className, children, ...rest }: SectionProps) {
  return (
    <section
      data-surface={tone === "emerald" || tone === "violet" ? tone : undefined}
      // overflow-x-clip (not hidden) so sticky children keep working
      className={cn("relative isolate overflow-x-clip py-12 md:py-16 lg:py-24", TONE[tone], className)}
      {...rest}
    >
      <div className={cn("mx-auto w-full max-w-300 px-4 md:px-10", containerClassName)}>{children}</div>
    </section>
  );
}