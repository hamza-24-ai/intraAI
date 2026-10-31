// components/questions/skill-nav.tsx
"use client";

import { useRef, type CSSProperties, type KeyboardEvent } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { skillPanelId, skillTabId } from "@/lib/question-bank-utils";
import { cn } from "@/lib/utils";

interface SkillNavItem {
  skill: string;
  count: number;
}

interface SkillNavProps {
  items: SkillNavItem[];
  selectedSkill: string | null;
  onSelect: (skill: string) => void;
  className?: string;
}

export function SkillNav({ items, selectedSkill, onSelect, className }: SkillNavProps) {
  const vertical = useMediaQuery("(min-width: 1024px)");
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = items.findIndex((item) => item.skill === selectedSkill);

  const focusAt = (index: number) => {
    onSelect(items[index].skill);
    buttons.current[index]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (items.length === 0) return;
    const next = vertical ? "ArrowDown" : "ArrowRight";
    const previous = vertical ? "ArrowUp" : "ArrowLeft";

    if (event.key === next) {
      event.preventDefault();
      focusAt((index + 1) % items.length);
    } else if (event.key === previous) {
      event.preventDefault();
      focusAt((index - 1 + items.length) % items.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusAt(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusAt(items.length - 1);
    }
  };

  return (
    <div
      className={cn(
        "sticky top-[calc(4.5rem+env(safe-area-inset-top))] z-20 -mx-4 self-start bg-white/85 px-4 py-2 backdrop-blur-md md:-mx-10 md:px-10",
        "lg:static lg:top-28 lg:z-10 lg:mx-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none",
        className
      )}
    >
      <div
        role="tablist"
        aria-label="Skills"
        aria-orientation={vertical ? "vertical" : "horizontal"}
        className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-col lg:overflow-visible lg:pb-0"
      >
        {items.map((item, index) => {
          const active = item.skill === selectedSkill;
          const tabbable = active || (selectedIndex === -1 && index === 0);

          return (
            <button
              key={item.skill}
              ref={(element) => {
                buttons.current[index] = element;
              }}
              id={skillTabId(item.skill)}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={skillPanelId(item.skill)}
              tabIndex={tabbable ? 0 : -1}
              onClick={() => onSelect(item.skill)}
              onKeyDown={(event) => onKeyDown(event, index)}
              style={active ? ({ "--flow-radius": "12px" } as CSSProperties) : undefined}
              className={cn(
                "relative flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors",
                "lg:w-full lg:justify-between",
                active
                  ? "flow-border flow-deep bg-violet-light text-violet-deep"
                  : "bg-white/80 text-ink hover:bg-white"
              )}
            >
              <span className="max-w-48 truncate lg:max-w-none">{item.skill}</span>
              <span
                className={cn(
                  "inline-flex min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold",
                  active ? "bg-white/80 text-violet-deep" : "bg-slate-light text-slate-dark"
                )}
              >
                {item.count}
                <span className="sr-only"> questions</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
