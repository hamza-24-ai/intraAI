// src/components/ui/flow-input.tsx
"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { FlowBorder } from "@/components/ui/flow-border";
import { cn } from "@/lib/utils";

interface FlowInputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  trailing?: ReactNode;
}

export const FlowInput = forwardRef<HTMLInputElement, FlowInputProps>(
  ({ className, invalid, trailing, ...props }, ref) => (
    <FlowBorder radius={12} width={1.5} tone="deep" motion="hover" invalid={invalid} className="bg-white">
      <div className="relative w-full">
        <input
          ref={ref}
          aria-invalid={invalid || undefined}
          className={cn(
            "h-12 w-full rounded-xl bg-transparent px-4 text-base text-ink",
            "placeholder:text-slate-dark focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-slate-light",
            trailing && "pr-14",
            className
          )}
          {...props}
        />
        {trailing ? (
          <div className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center">
            <div className="pointer-events-auto">{trailing}</div>
          </div>
        ) : null}
      </div>
    </FlowBorder>
  )
);
FlowInput.displayName = "FlowInput";