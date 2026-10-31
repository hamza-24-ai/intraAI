// components/shared/difficulty-picker.tsx
"use client";

import { Check } from "lucide-react";
import { useRef } from "react";
import { FlowBorder } from "@/components/ui/flow-border";
import { DIFFICULTY_OPTIONS } from "@/lib/constants";
import type { Difficulty } from "@/lib/schemas";
import { cn } from "@/lib/utils";

interface DifficultyPickerProps {
  value: Difficulty;
  onChange: (value: Difficulty) => void;
  disabled?: boolean;
  completed?: Difficulty[];
}

export function DifficultyPicker({ value, onChange, disabled = false, completed = [] }: DifficultyPickerProps) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (index: number, direction: 1 | -1 | "first" | "last") => {
    const next =
      direction === "first"
        ? 0
        : direction === "last"
          ? DIFFICULTY_OPTIONS.length - 1
          : (index + direction + DIFFICULTY_OPTIONS.length) % DIFFICULTY_OPTIONS.length;
    onChange(DIFFICULTY_OPTIONS[next].value);
    buttons.current[next]?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      move(index, 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      move(index, -1);
    } else if (e.key === "Home") {
      e.preventDefault();
      move(index, "first");
    } else if (e.key === "End") {
      e.preventDefault();
      move(index, "last");
    }
  };

  return (
    <div role="radiogroup" aria-label="Interview difficulty" className="grid gap-3 md:grid-cols-2">
      {DIFFICULTY_OPTIONS.map((option, i) => {
        const selected = option.value === value;
        const generated = completed.includes(option.value);
        return (
          <FlowBorder
            key={option.value}
            radius={20}
            width={2}
            motion="hover"
            className={cn("bg-white transition-colors", selected && "bg-violet-light")}
          >
            <button
              ref={(el) => {
                buttons.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className="flex min-h-11 w-full items-start gap-3 rounded-[20px] p-4 text-left disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span aria-hidden className="mt-0.5 flex items-end gap-0.5 text-violet-deep">
                {[1, 2, 3, 4].map((bar) => (
                  <span
                    key={bar}
                    className={cn("w-[3px] rounded-full bg-current", bar > option.level && "opacity-30")}
                    style={{ height: `${3 + bar * 2}px` }}
                  />
                ))}
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className={cn("font-display text-base font-bold", selected ? "text-violet-deep" : "text-ink")}>
                    {option.label}
                  </span>
                  {generated && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-mint px-2 py-0.5 text-xs font-semibold text-emerald-dark">
                      <Check aria-hidden className="size-3.5" />
                      Generated
                    </span>
                  )}
                </span>
                <span className="mt-1 block text-sm text-slate-dark">{option.description}</span>
                <span className="sr-only">Level {option.level} of 4</span>
              </span>

              {selected && (
                <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-violet-deep text-white">
                  <Check aria-hidden className="size-4" />
                  <span className="sr-only">Selected</span>
                </span>
              )}
            </button>
          </FlowBorder>
        );
      })}
    </div>
  );
}
