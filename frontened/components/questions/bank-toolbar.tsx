// components/questions/bank-toolbar.tsx
"use client";

import { RefreshCw, Search, X } from "lucide-react";
import { useMemo } from "react";
import { FlowInput } from "@/components/ui/flow-input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Button } from "@/components/ui/button";
import { DIFFICULTY_OPTIONS } from "@/lib/constants";
import type { Difficulty } from "@/lib/schemas";

interface BankToolbarProps {
  query: string;
  onQueryChange: (value: string) => void;
  difficulty: Difficulty;
  onDifficultyChange: (value: Difficulty) => void;
  generated: Difficulty[];
  onRegenerate: () => void;
  disabled: boolean;
}

export function BankToolbar({
  query,
  onQueryChange,
  difficulty,
  onDifficultyChange,
  generated,
  onRegenerate,
  disabled,
}: BankToolbarProps) {
  const options = useMemo(
    () =>
      DIFFICULTY_OPTIONS.map((option) => ({
        value: option.value,
        label: (
          <span className="inline-flex items-center gap-1.5">
            {option.label}
            {generated.includes(option.value) ? (
              <>
                <span aria-hidden className="size-1.5 rounded-full bg-brand-emerald" />
                <span className="sr-only">generated</span>
              </>
            ) : null}
          </span>
        ),
      })),
    [generated]
  );

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative w-full lg:max-w-md">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 z-10 size-5 -translate-y-1/2 text-slate-dark"
        />
        <FlowInput
          aria-label="Search questions"
          placeholder="Search questions"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="pl-11"
          trailing={
            query ? (
              <button
                type="button"
                onClick={() => onQueryChange("")}
                aria-label="Clear search"
                className="inline-flex size-11 items-center justify-center rounded-full text-slate-dark hover:bg-slate-light"
              >
                <X aria-hidden className="size-5" />
              </button>
            ) : undefined
          }
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          options={options}
          value={difficulty}
          onChange={onDifficultyChange}
          ariaLabel="Difficulty"
          className="max-w-full"
        />
        <Button variant="ghost" onClick={onRegenerate} disabled={disabled}>
          <RefreshCw aria-hidden className="size-4" />
          Regenerate
        </Button>
      </div>
    </div>
  );
}
