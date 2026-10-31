// components/shared/difficulty-badge.tsx
import { DIFFICULTY_OPTIONS } from "@/lib/constants";
import type { Difficulty } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const BADGE_STYLES: Record<Difficulty, string> = {
  beginner: "bg-violet-light text-violet-deep",
  intermediate: "bg-mint text-emerald-dark",
  technical: "bg-warning-tint text-warning",
  deep: "bg-brand-violet text-white",
};

function IntensityIcon({ level, className }: { level: number; className?: string }) {
  return (
    <span aria-hidden className={cn("flex items-end gap-0.5", className)}>
      {[1, 2, 3, 4].map((bar) => (
        <span
          key={bar}
          className={cn("w-[3px] rounded-full bg-current", bar > level && "opacity-30")}
          style={{ height: `${3 + bar * 2}px` }}
        />
      ))}
    </span>
  );
}

export function DifficultyBadge({
  difficulty,
  className,
}: {
  difficulty: string;
  className?: string;
}) {
  const option = DIFFICULTY_OPTIONS.find((o) => o.value === difficulty);

  if (!option) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full bg-slate-light px-2.5 py-1 text-xs font-semibold text-slate-dark",
          className
        )}
      >
        {difficulty}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        BADGE_STYLES[option.value],
        className
      )}
    >
      <IntensityIcon level={option.level} />
      {option.label}
    </span>
  );
}
