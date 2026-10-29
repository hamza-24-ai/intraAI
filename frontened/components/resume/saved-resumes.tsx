// components/resume/saved-resumes.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { History, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlowBorder } from "@/components/ui/flow-border";
import { Skeleton } from "@/components/ui/skeleton";
import { listResumes } from "@/lib/api/resumes";
import { pathAfterResume, withNext, type ResumeNext } from "@/lib/resume-flow";
import type { ParsedResume, Resume } from "@/lib/schemas";
import { selectIsAuthenticated, useAuthStore } from "@/stores/auth-store";
import { useResumeStore } from "@/stores/resume-store";

interface SavedResumesProps {
  next: ResumeNext | null;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function SavedResumes({ next }: SavedResumesProps) {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const [resumes, setResumes] = useState<Resume[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!hydrated || !isAuthenticated) return;
    let alive = true;

    listResumes()
      .then((items) => {
        if (!alive) return;
        const usable = items
          .filter((item) => (item.parsed_skills?.skills?.length ?? 0) > 0)
          .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())
          .slice(0, 5);
        setResumes(usable);
      })
      .catch(() => {
        if (!alive) return;
        setFailed(true);
        setResumes([]);
      });

    return () => {
      alive = false;
    };
  }, [hydrated, isAuthenticated]);

  if (!hydrated || !isAuthenticated || failed) return null;

  const handleUse = (resume: Resume) => {
    const partial = resume.parsed_skills;
    const parsed: ParsedResume = {
      skills: partial?.skills ?? [],
      target_role: partial?.target_role ?? null,
      role_source: partial?.role_source ?? "unknown",
      experience_level: partial?.experience_level ?? "student",
      projects: partial?.projects ?? [],
    };
    const needsManualRole = !parsed.target_role;
    const label = formatDate(resume.uploaded_at);

    useResumeStore.getState().setUploadResult({
      fileName: `Saved resume, ${label}`,
      resumeId: resume.id,
      saved: true,
      parsed,
      needsManualRole,
    });

    router.push(
      needsManualRole || parsed.skills.length === 0
        ? withNext("/resume/confirm", next)
        : pathAfterResume(next)
    );
  };

  return (
    <section className="mt-6" aria-labelledby="saved-resumes-heading">
      <h2 id="saved-resumes-heading" className="flex items-center gap-2 text-lg font-bold text-ink">
        <History className="size-5 text-brand-violet" aria-hidden />
        Use a saved resume
      </h2>

      {resumes === null ? (
        <div className="mt-3 space-y-2" aria-hidden>
          <p className="sr-only" role="status">
            Loading saved resumes
          </p>
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      ) : resumes.length === 0 ? (
        <p className="mt-2 text-sm text-slate-dark">No saved resumes yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {resumes.map((resume) => {
            const skills = resume.parsed_skills?.skills ?? [];
            const role = resume.parsed_skills?.target_role ?? null;
            return (
              <li key={resume.id}>
                <FlowBorder radius={16} width={1.5} motion="hover" className="bg-white">
                  <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-semibold text-ink">
                        <Sparkles className="size-4 shrink-0 text-brand-violet" aria-hidden />
                        <span className="truncate">{role ?? "No role yet"}</span>
                      </p>
                      <p className="mt-0.5 text-sm text-slate-dark">
                        {skills.length} {skills.length === 1 ? "skill" : "skills"} · {formatDate(resume.uploaded_at)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0"
                      onClick={() => handleUse(resume)}
                    >
                      Use this resume
                    </Button>
                  </div>
                </FlowBorder>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
