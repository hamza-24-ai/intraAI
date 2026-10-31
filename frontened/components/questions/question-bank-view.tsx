// components/questions/question-bank-view.tsx
"use client";

import axios from "axios";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { BankToolbar } from "@/components/questions/bank-toolbar";
import { GeneratePanel } from "@/components/questions/generate-panel";
import { GeneratingState } from "@/components/questions/generating-state";
import { GenerationError } from "@/components/questions/generation-error";
import { MissingSkillsNotice } from "@/components/questions/missing-skills-notice";
import { SkillEmptyState } from "@/components/questions/skill-empty-state";
import { SkillNav } from "@/components/questions/skill-nav";
import { SkillPanel } from "@/components/questions/skill-panel";
import { OfflineBanner } from "@/components/shared/offline-banner";
import { Aurora } from "@/components/ui/aurora";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useRequireResume } from "@/hooks/use-require-resume";
import { getErrorMessage } from "@/lib/api/client";
import { generateQuestionBank } from "@/lib/api/questions";
import { DIFFICULTY_OPTIONS } from "@/lib/constants";
import {
  filterSets,
  findMissingSkills,
  makeContextKey,
  normalizeSkill,
  resolveRequestedSkill,
} from "@/lib/question-bank-utils";
import type { Difficulty } from "@/lib/schemas";
import { useAuthStore } from "@/stores/auth-store";
import { useQuestionBankStore } from "@/stores/question-bank-store";
import { useResumeStore } from "@/stores/resume-store";

type ErrorKind = "network" | "timeout" | "other";
type Status = "idle" | "generating" | "error";

const NETWORK_MESSAGE = "Cannot reach the server. Check your connection and try again.";
const TIMEOUT_MESSAGE = "This is taking longer than expected. Please try again.";
const FALLBACK_MESSAGE = "Something went wrong on our side. Please try again.";

function classifyGenerationError(error: unknown): { kind: ErrorKind; message: string } {
  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return { kind: "timeout", message: TIMEOUT_MESSAGE };
    }
    if (!error.response) return { kind: "network", message: NETWORK_MESSAGE };
  }
  const message = getErrorMessage(error);
  return { kind: "other", message: message || FALLBACK_MESSAGE };
}

function PageSkeleton() {
  return (
    <section className="relative isolate w-full pb-10 pt-10 md:pt-14">
      <Aurora />
      <div className="mx-auto w-full max-w-300 px-4 md:px-10">
        <p role="status" className="sr-only">
          Loading your question bank
        </p>
        <div className="shimmer h-10 w-64 rounded-xl" />
        <div className="shimmer mt-3 h-5 w-40 rounded-md" />
        <div className="mt-8 space-y-3">
          <div className="shimmer h-12 rounded-xl" />
          <div className="shimmer h-40 rounded-2xl" />
        </div>
      </div>
    </section>
  );
}

export function QuestionBankView() {
  const router = useRouter();
  const { ready } = useRequireResume();
  const online = useOnlineStatus();
  const reduce = useReducedMotion();

  const banks = useQuestionBankStore((state) => state.banks);
  const activeDifficulty = useQuestionBankStore((state) => state.activeDifficulty);
  const exportedAt = useQuestionBankStore((state) => state.exportedAt);
  const authHydrated = useAuthStore((state) => state.hasHydrated);
  const isAuthenticated = useAuthStore((state) => state.accessToken !== null);

  // Resume data cannot change while this page is open; snapshot it once.
  const [initial] = useState(() => {
    const store = useResumeStore.getState();
    return {
      payload: store.getContextPayload(),
      skills: store.parsed?.skills ?? [],
      targetRole: store.parsed?.target_role ?? null,
    };
  });

  const [status, setStatus] = useState<Status>("idle");
  const [errorKind, setErrorKind] = useState<ErrorKind | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [successTick, setSuccessTick] = useState(0);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const autoRetriedRef = useRef(false);
  const offlineAtErrorRef = useRef(false);
  const errorDifficultyRef = useRef<Difficulty | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const skillsCount = initial.skills.length;
  const requestedSkills = initial.skills;

  useEffect(() => {
    if (!initial.payload) return;
    useQuestionBankStore.getState().ensureContext(makeContextKey(initial.payload));
  }, [initial.payload]);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 150);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (successTick === 0) return;
    headingRef.current?.focus();
  }, [successTick]);

  const runGeneration = useCallback(
    async (difficulty: Difficulty) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      offlineAtErrorRef.current = false;
      setStatus("generating");
      setErrorKind(null);
      setErrorMessage("");
      setAnnouncement(
        `Generating questions for ${skillsCount} ${skillsCount === 1 ? "skill" : "skills"}.`
      );

      try {
        await generateQuestionBank(difficulty, controller.signal);
        if (controller.signal.aborted) return;
        setStatus("idle");
        setSuccessTick((value) => value + 1);
        setAnnouncement(
          `Questions ready for ${skillsCount} ${skillsCount === 1 ? "skill" : "skills"}.`
        );
        toast.success("Questions ready");
      } catch (error: unknown) {
        if (controller.signal.aborted || axios.isCancel(error)) return;
        const copy = classifyGenerationError(error);
        if (copy.kind === "network") offlineAtErrorRef.current = !navigator.onLine;
        setErrorKind(copy.kind);
        setErrorMessage(copy.message);
        setStatus("error");
        setAnnouncement(copy.message);
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [skillsCount]
  );

  // Retry automatically once if the request failed while the device was offline.
  useEffect(() => {
    if (status !== "error" || errorKind !== "network" || !online) return;
    if (!offlineAtErrorRef.current || autoRetriedRef.current) return;
    autoRetriedRef.current = true;
    toast.info("Back online, retrying.");
    const difficulty = errorDifficultyRef.current;
    if (difficulty) void runGeneration(difficulty);
  }, [status, errorKind, online, runGeneration]);

  const isGuest = authHydrated && !isAuthenticated;

  useEffect(() => {
    if (!isGuest || exportedAt !== null) return;
    const hasUnsavedBank = Object.values(banks).some((entry) => entry && !entry.saved);
    if (!hasUnsavedBank) return;

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [banks, exportedAt, isGuest]);

  const activeEntry = banks[activeDifficulty] ?? null;

  const generatedDifficulties = useMemo(
    () => (Object.keys(banks) as Difficulty[]).filter((difficulty) => banks[difficulty]),
    [banks]
  );

  const visibleSets = useMemo(
    () => (activeEntry ? filterSets(activeEntry.questionSets, debouncedQuery) : []),
    [activeEntry, debouncedQuery]
  );

  const selectedSet = useMemo(() => {
    if (visibleSets.length === 0) return null;
    if (selectedKey) {
      const match = visibleSets.find(
        (set) =>
          normalizeSkill(resolveRequestedSkill(set.skill, requestedSkills)) === selectedKey
      );
      if (match) return match;
    }
    return visibleSets[0];
  }, [visibleSets, selectedKey, requestedSkills]);

  const selectedDisplaySkill = selectedSet
    ? resolveRequestedSkill(selectedSet.skill, requestedSkills)
    : null;

  const fullSet = useMemo(() => {
    if (!activeEntry || !selectedSet) return null;
    const key = normalizeSkill(selectedSet.skill);
    return activeEntry.questionSets.find((set) => normalizeSkill(set.skill) === key) ?? null;
  }, [activeEntry, selectedSet]);

  const missingSkills = activeEntry
    ? findMissingSkills(requestedSkills, activeEntry.questionSets)
    : [];

  const navItems = visibleSets.map((set) => ({
    skill: resolveRequestedSkill(set.skill, requestedSkills),
    count: set.questions.length,
  }));

  const matchingQuestions = visibleSets.reduce((total, set) => total + set.questions.length, 0);
  const searchAnnouncement =
    activeEntry && debouncedQuery
      ? `${matchingQuestions} ${matchingQuestions === 1 ? "question" : "questions"} in ${
          visibleSets.length
        } ${visibleSets.length === 1 ? "skill" : "skills"}.`
      : "";

  const difficultyLabel =
    DIFFICULTY_OPTIONS.find((option) => option.value === activeDifficulty)?.label ?? "Intermediate";
  const subline = `${initial.targetRole || "Software Engineer"} · ${skillsCount} ${
    skillsCount === 1 ? "skill" : "skills"
  }`;

  const startGeneration = (difficulty: Difficulty) => {
    autoRetriedRef.current = false;
    errorDifficultyRef.current = difficulty;
    void runGeneration(difficulty);
  };

  const handlePickDifficulty = (difficulty: Difficulty) => {
    useQuestionBankStore.getState().setActiveDifficulty(difficulty);
    setStatus("idle");
    setErrorKind(null);
    setErrorMessage("");
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus("idle");
    setAnnouncement("Generation cancelled.");
  };

  const selectSkill = (skill: string) => {
    setSelectedKey(normalizeSkill(skill));
    if (window.matchMedia("(min-width: 1024px)").matches) return;
    requestAnimationFrame(() => {
      panelRef.current?.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "start",
      });
    });
  };

  const clearSearch = () => {
    setQuery("");
    setDebouncedQuery("");
  };

  if (!ready) return <PageSkeleton />;

  return (
    <section className="relative isolate w-full pb-10 pt-10 md:pt-14">
      <Aurora />
      <div className="mx-auto w-full max-w-300 px-4 md:px-10">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-3xl font-bold text-ink focus:outline-none md:text-4xl"
        >
          Your Question Bank
        </h1>
        <p className="mt-2 text-base text-slate-dark">{subline}</p>

        {activeEntry ? (
          activeEntry.saved ? (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-mint px-3 py-1.5 text-sm font-semibold text-emerald-dark">
              <CheckCircle2 aria-hidden className="size-4" />
              Saved to your account
            </p>
          ) : (
            <p className="mt-3 flex max-w-2xl items-start gap-2 rounded-2xl bg-warning-tint px-3 py-2 text-sm font-medium text-warning">
              <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
              Guest mode: this question bank disappears when you close the page. Download a PDF to
              keep it.
            </p>
          )
        ) : null}

        <p role="status" aria-live="polite" className="sr-only">
          {announcement}
        </p>
        <p role="status" aria-live="polite" className="sr-only">
          {status === "idle" ? searchAnnouncement : ""}
        </p>

        {!online ? <OfflineBanner className="mt-4" /> : null}

        {status === "generating" ? (
          <GeneratingState skills={requestedSkills} onCancel={handleCancel} />
        ) : status === "error" ? (
          <GenerationError
            message={errorMessage}
            online={online}
            retrying={false}
            onRetry={() => startGeneration(errorDifficultyRef.current ?? activeDifficulty)}
            onBack={() => router.push("/resume/confirm")}
          />
        ) : activeEntry ? (
          <>
            <div className="mt-8">
              <BankToolbar
                query={query}
                onQueryChange={setQuery}
                difficulty={activeDifficulty}
                onDifficultyChange={handlePickDifficulty}
                generated={generatedDifficulties}
                onRegenerate={() => setConfirmOpen(true)}
                disabled={!online}
              />
            </div>

            <MissingSkillsNotice
              skills={missingSkills}
              onRetry={() => setConfirmOpen(true)}
              disabled={!online}
            />

            {visibleSets.length === 0 ? (
              <div className="mt-6">
                {debouncedQuery ? (
                  <SkillEmptyState
                    title={`No questions match "${debouncedQuery}"`}
                    description="Try a different word, or clear the search to see everything again."
                    actionLabel="Clear search"
                    onAction={clearSearch}
                  />
                ) : (
                  <SkillEmptyState
                    title="No questions came back"
                    description="The search did not return questions for these skills. Try generating the bank again."
                    actionLabel="Generate again"
                    onAction={() => startGeneration(activeDifficulty)}
                    disabled={!online}
                  />
                )}
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
                <SkillNav
                  className="lg:col-span-3"
                  items={navItems}
                  selectedSkill={selectedDisplaySkill}
                  onSelect={selectSkill}
                />

                <div
                  ref={panelRef}
                  className="scroll-mt-[calc(9rem+env(safe-area-inset-top))] lg:col-span-9"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {selectedSet && fullSet ? (
                      <motion.div
                        key={selectedDisplaySkill ?? "skill"}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: reduce ? 0.2 : 0.25, ease: "easeOut" }}
                      >
                        <SkillPanel
                          set={selectedSet}
                          fullSet={fullSet}
                          allSets={activeEntry.questionSets}
                          difficulty={activeDifficulty}
                          targetRole={initial.targetRole}
                          requestedSkills={requestedSkills}
                          disabled={!online}
                          onRegenerate={() => setConfirmOpen(true)}
                        />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </>
        ) : (
          <GeneratePanel
            value={activeDifficulty}
            onChange={handlePickDifficulty}
            completed={generatedDifficulties}
            offline={!online}
            onGenerate={() => startGeneration(activeDifficulty)}
          />
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Replace these questions?"
        description={`We will generate a new set for ${difficultyLabel}. The current set will be removed.`}
        confirmLabel="Replace"
        cancelLabel="Keep them"
        onConfirm={() => {
          setConfirmOpen(false);
          startGeneration(activeDifficulty);
        }}
      />
    </section>
  );
}
