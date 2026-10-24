// src/components/ui/glass-card.tsx
import type { HTMLAttributes } from "react";
import { FlowBorder } from "@/components/ui/flow-border";
import { cn } from "@/lib/utils";

/** Text always sits on this card, never directly on the gradient (keeps 4.5:1). */
export function GlassCard({ className, children, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <FlowBorder
      radius={24}
      width={1.5}
      className={cn("bg-white/85 shadow-lg backdrop-blur-xl", className)}
      {...props}
    >
      {children}
    </FlowBorder>
  );
}