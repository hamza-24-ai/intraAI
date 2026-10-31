// components/questions/export-actions.tsx
"use client";

import { FileDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadAllPdf, downloadSkillPdf } from "@/lib/pdf/question-bank-pdf";
import type { Difficulty, QuestionSet } from "@/lib/schemas";
import { useQuestionBankStore } from "@/stores/question-bank-store";

interface ExportActionsProps {
  set: QuestionSet;
  sets: QuestionSet[];
  difficulty: Difficulty;
  targetRole: string | null;
}

export function ExportActions({ set, sets, difficulty, targetRole }: ExportActionsProps) {
  const [busy, setBusy] = useState<"skill" | "all" | null>(null);

  const run = async (kind: "skill" | "all", task: () => Promise<void>) => {
    if (busy) return;
    setBusy(kind);
    try {
      await task();
      useQuestionBankStore.getState().markExported();
      toast.success("PDF downloaded");
    } catch {
      toast.error("Could not create the PDF. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        className="h-11"
        aria-busy={busy === "skill"}
        disabled={busy !== null}
        onClick={() => run("skill", () => downloadSkillPdf({ set, difficulty, targetRole }))}
      >
        {busy === "skill" ? (
          <Loader2 aria-hidden className="animate-spin" />
        ) : (
          <FileDown aria-hidden />
        )}
        Download PDF
      </Button>

      <Button
        variant="ghost"
        className="h-11"
        aria-busy={busy === "all"}
        disabled={busy !== null}
        onClick={() => run("all", () => downloadAllPdf({ sets, difficulty, targetRole }))}
      >
        {busy === "all" ? (
          <Loader2 aria-hidden className="animate-spin" />
        ) : (
          <FileDown aria-hidden />
        )}
        All skills (one PDF)
      </Button>
    </div>
  );
}
