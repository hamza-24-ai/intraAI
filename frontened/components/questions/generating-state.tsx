// components/questions/generating-state.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function GeneratingState({ skills, onCancel }: { skills: string[]; onCancel: () => void }) {
  const [index, setIndex] = useState(0);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 45_000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (skills.length <= 1) return;
    const timer = setInterval(() => setIndex((value) => (value + 1) % skills.length), 2_500);
    return () => clearInterval(timer);
  }, [skills.length]);

  const currentSkill = skills.length > 0 ? skills[index % skills.length] : "your skills";

  return (
    <div aria-busy="true" className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-dark">Finding {currentSkill} questions...</p>
        <Button variant="outline" className="h-11" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      {slow ? (
        <p className="mt-2 text-sm text-slate-dark">
          This is taking longer than usual, but we are still working on it.
        </p>
      ) : null}

      <div aria-hidden className="mt-6 grid gap-6 lg:grid-cols-12">
        <div className="space-y-2 lg:col-span-3">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="shimmer h-12 rounded-xl" />
          ))}
        </div>

        <div className="space-y-3 lg:col-span-9">
          <div className="shimmer h-8 w-2/3 rounded-lg" />
          <div className="shimmer h-4 w-32 rounded-md" />
          <div className="space-y-3 pt-3">
            {[0, 1, 2, 3, 4].map((item) => (
              <div key={item} className="shimmer h-16 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
