// src/components/ui/flow-input.tsx
"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { FlowBorder } from "@/components/ui/flow-border";
import { cn } from "@/lib/utils";

interface FlowInputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const FlowInput = forwardRef<HTMLInputElement, FlowInputProps>(
  ({ className, invalid, ...props }, ref) => (
    <FlowBorder radius={12} width={1.5} tone="deep" motion="hover" invalid={invalid} className="bg-white">
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          "h-12 w-full rounded-xl bg-transparent px-4 text-base text-ink",
          "placeholder:text-slate-dark focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-slate-light",
          className
        )}
        {...props}
      />
    </FlowBorder>
  )
);
FlowInput.displayName = "FlowInput";