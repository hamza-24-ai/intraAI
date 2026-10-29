// components/resume/role-source-badge.tsx
"use client";

import { AlertTriangle, FileText, Info, Pencil, Sparkles } from "lucide-react";
import { useId, useState } from "react";

interface RoleSourceBadgeProps {
  source: string | null;
}

const BASE =
  "inline-flex min-h-7 max-w-full flex-wrap items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold";

export function RoleSourceBadge({ source }: RoleSourceBadgeProps) {
  const [open, setOpen] = useState(false);
  const explanationId = useId();

  if (source === "headline") {
    return (
      <span className={`${BASE} bg-mint text-emerald-dark`}>
        <FileText className="size-3.5 shrink-0" aria-hidden />
        From your resume headline
      </span>
    );
  }

  if (source === "inferred_from_skills") {
    return (
      <span className="inline-flex flex-col items-start gap-1">
        <span className={`${BASE} bg-violet-light text-violet-deep`}>
          <Sparkles className="size-3.5 shrink-0" aria-hidden />
          Guessed from your skills
          <button
            type="button"
            aria-expanded={open}
            aria-controls={explanationId}
            aria-label="What does 'Guessed from your skills' mean?"
            onClick={() => setOpen((value) => !value)}
            className="-my-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-violet-deep hover:bg-white/70"
          >
            <Info className="size-4" aria-hidden />
          </button>
        </span>
        {open ? (
          <span id={explanationId} className="max-w-xs pl-1 text-xs font-medium text-slate-dark">
            We guessed this from the skills on your resume. Change it if it is wrong.
          </span>
        ) : null}
      </span>
    );
  }

  if (source === "manual") {
    return (
      <span className={`${BASE} bg-mint text-emerald-dark`}>
        <Pencil className="size-3.5 shrink-0" aria-hidden />
        Set by you
      </span>
    );
  }

  return (
    <span className={`${BASE} bg-warning-tint text-warning`}>
      <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
      Please choose your role
    </span>
  );
}
