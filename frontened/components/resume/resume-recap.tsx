// components/resume/resume-recap.tsx
import Link from "next/link";
import { FlowBorder } from "@/components/ui/flow-border";

interface ResumeRecapProps {
  targetRole: string | null;
  skillCount: number;
  isGuest: boolean;
}

export function ResumeRecap({ targetRole, skillCount, isGuest }: ResumeRecapProps) {
  return (
    <FlowBorder radius={16} width={1.5} className="bg-white/85">
      <div className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink">
            <span className="font-semibold">{targetRole ?? "No role yet"}</span>
            {" · "}
            {skillCount} {skillCount === 1 ? "skill" : "skills"}
          </p>
          <Link
            href="/resume/confirm"
            className="inline-flex min-h-12 items-center text-sm font-semibold text-brand-violet underline underline-offset-4"
          >
            Edit
          </Link>
        </div>
        {isGuest ? (
          <p className="mt-1 text-sm text-slate-dark">
            Guest mode: everything works, your history is not saved.{" "}
            <Link href="/login?next=/start" className="font-semibold text-brand-violet underline underline-offset-4">
              Sign in
            </Link>
          </p>
        ) : null}
      </div>
    </FlowBorder>
  );
}
