// components/resume/resume-upload-flow.tsx
"use client";

import axios from "axios";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FileCheck2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { ResumeDropzone } from "@/components/resume/resume-dropzone";
import { SavedResumes } from "@/components/resume/saved-resumes";
import { UploadError } from "@/components/resume/upload-error";
import { UploadProgress, type UploadStep } from "@/components/resume/upload-progress";
import { UploadSuccess } from "@/components/resume/upload-success";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FlowBorder } from "@/components/ui/flow-border";
import { uploadResume } from "@/lib/api/resumes";
import { classifyUploadError, getResumeFileProblem, type UploadErrorKind } from "@/lib/resume-errors";
import { parseNext, pathAfterResume, withNext } from "@/lib/resume-flow";
import type { UploadResumeResponse } from "@/lib/schemas";
import { useResumeStore } from "@/stores/resume-store";

type FlowState =
  | { kind: "idle" }
  | { kind: "uploading"; file: File; percent: number; step: UploadStep }
  | { kind: "success"; file: File; response: UploadResumeResponse }
  | { kind: "error"; errorKind: UploadErrorKind; file: File | null }
  | { kind: "loaded" };

type FlowAction =
  | { type: "start"; file: File }
  | { type: "progress"; percent: number }
  | { type: "step"; step: UploadStep }
  | { type: "success"; file: File; response: UploadResumeResponse }
  | { type: "error"; errorKind: UploadErrorKind; file: File | null }
  | { type: "idle" }
  | { type: "loaded" };

function reducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case "start":
      return { kind: "uploading", file: action.file, percent: 0, step: 0 };
    case "progress": {
      if (state.kind !== "uploading") return state;
      const percent = Math.min(100, Math.max(0, action.percent));
      const step: UploadStep = percent >= 100 && state.step < 1 ? 1 : state.step;
      return { ...state, percent, step };
    }
    case "step":
      if (state.kind !== "uploading") return state;
      return { ...state, step: Math.max(state.step, action.step) as UploadStep };
    case "success":
      return { kind: "success", file: action.file, response: action.response };
    case "error":
      return { kind: "error", errorKind: action.errorKind, file: action.file };
    case "loaded":
      return { kind: "loaded" };
    case "idle":
      return { kind: "idle" };
  }
}

function initFlow(): FlowState {
  return useResumeStore.getState().parsed ? { kind: "loaded" } : { kind: "idle" };
}

interface LoadedRecapProps {
  onContinue: () => void;
  onEdit: () => void;
  onUploadAnother: () => void;
}

function LoadedRecap({ onContinue, onEdit, onUploadAnother }: LoadedRecapProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const parsed = useResumeStore((s) => s.parsed);
  const fileName = useResumeStore((s) => s.fileName);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  if (!parsed) return null;

  const role = parsed.target_role ?? "no target role yet";
  const skillCount = parsed.skills.length;

  return (
    <FlowBorder radius={20} width={2} tone="deep" className="bg-white/90">
      <div className="space-y-4 p-6">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-mint text-emerald-dark">
            <FileCheck2 className="size-6" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2
              ref={headingRef}
              tabIndex={-1}
              data-state-heading
              className="font-display text-xl font-bold text-ink focus:outline-none"
            >
              Using {fileName ?? "your resume"}
            </h2>
            <p className="mt-1 text-sm text-slate-dark">
              {skillCount} {skillCount === 1 ? "skill" : "skills"}, {role}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button type="button" size="lg" className="w-full sm:w-auto" onClick={onContinue}>
            Continue
          </Button>
          <Button type="button" variant="outline" size="lg" className="w-full sm:w-auto" onClick={onEdit}>
            Edit details
          </Button>
          <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={onUploadAnother}>
            Upload a different file
          </Button>
        </div>
      </div>
    </FlowBorder>
  );
}

export function ResumeUploadFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = parseNext(searchParams.get("next"));
  const reduce = useReducedMotion();

  const [state, dispatch] = useReducer(reducer, undefined, initFlow);
  const [slowFile, setSlowFile] = useState<File | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);

  const fileRef = useRef<File | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const uploadingFile = state.kind === "uploading" ? state.file : null;
  const uploadStep = state.kind === "uploading" ? state.step : null;

  const beginUpload = useCallback((file: File) => {
    const problem = getResumeFileProblem(file);
    if (problem) {
      fileRef.current = file;
      dispatch({ type: "error", errorKind: problem, file });
      return;
    }

    fileRef.current = file;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    dispatch({ type: "start", file });

    void uploadResume(
      file,
      (percent) => {
        if (controller.signal.aborted) return;
        dispatch({ type: "progress", percent });
      },
      controller.signal
    )
      .then((response) => {
        if (controller.signal.aborted) return;
        dispatch({ type: "step", step: 3 });
        successTimerRef.current = setTimeout(() => {
          if (controller.signal.aborted) return;
          dispatch({ type: "success", file, response });
        }, 400);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || axios.isCancel(error)) return;
        dispatch({ type: "error", errorKind: classifyUploadError(error), file });
      });
  }, []);

  // The parsing step has no real progress, so nudge it forward after 4 s.
  useEffect(() => {
    if (uploadStep !== 1) return;
    const timer = setTimeout(() => dispatch({ type: "step", step: 2 }), 4_000);
    return () => clearTimeout(timer);
  }, [uploadStep]);

  useEffect(() => {
    if (!uploadingFile) return;
    const timer = setTimeout(() => setSlowFile(uploadingFile), 30_000);
    return () => clearTimeout(timer);
  }, [uploadingFile]);

  const slow = uploadingFile !== null && slowFile === uploadingFile;

  useEffect(
    () => () => {
      abortRef.current?.abort();
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    },
    []
  );

  const handleCancel = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
    fileRef.current = null;
    dispatch({ type: "idle" });
  };

  const handleRetry = () => {
    const file = fileRef.current;
    if (file) beginUpload(file);
    else dispatch({ type: "idle" });
  };

  const handleChooseAnother = () => {
    fileRef.current = null;
    dispatch({ type: "idle" });
  };

  const goToConfirm = () => router.push(withNext("/resume/confirm", next));

  const continueFromLoaded = () => {
    const store = useResumeStore.getState();
    const parsed = store.parsed;
    if (!parsed) {
      goToConfirm();
      return;
    }
    router.push(
      store.needsManualRole || parsed.skills.length === 0
        ? withNext("/resume/confirm", next)
        : pathAfterResume(next)
    );
  };

  const confirmDiscard = () => {
    setDiscardOpen(false);
    fileRef.current = null;
    useResumeStore.getState().reset();
    dispatch({ type: "idle" });
  };

  const transition = reduce ? { duration: 0.2 } : { duration: 0.3, ease: "easeOut" as const };
  const enterFrom = reduce ? { opacity: 0 } : { opacity: 0, y: 16 };

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={state.kind}
          initial={enterFrom}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={transition}
        >
          {state.kind === "idle" ? (
            <div className="space-y-6">
              <ResumeDropzone onFile={beginUpload} />
              <SavedResumes next={next} />
            </div>
          ) : null}

          {state.kind === "uploading" ? (
            <UploadProgress
              file={state.file}
              percent={state.percent}
              step={state.step}
              slow={slow}
              onCancel={handleCancel}
            />
          ) : null}

          {state.kind === "success" ? (
            <UploadSuccess
              parsed={state.response.parsed}
              saved={state.response.saved}
              onContinue={() => {
                const needsConfirm =
                  state.response.needs_manual_role_input || state.response.parsed.skills.length === 0;
                router.push(needsConfirm ? withNext("/resume/confirm", next) : pathAfterResume(next));
              }}
              onEdit={goToConfirm}
            />
          ) : null}

          {state.kind === "error" ? (
            <UploadError
              kind={state.errorKind}
              file={state.file}
              onRetry={handleRetry}
              onChooseAnother={handleChooseAnother}
              onManual={goToConfirm}
            />
          ) : null}

          {state.kind === "loaded" ? (
            <LoadedRecap
              onContinue={continueFromLoaded}
              onEdit={goToConfirm}
              onUploadAnother={() => setDiscardOpen(true)}
            />
          ) : null}
        </motion.div>
      </AnimatePresence>

      <ConfirmDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        title="Discard this resume?"
        description="Your skills and role will be cleared."
        confirmLabel="Discard"
        cancelLabel="Keep it"
        destructive
        onConfirm={confirmDiscard}
      />
    </>
  );
}
