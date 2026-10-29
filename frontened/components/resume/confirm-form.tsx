// components/resume/confirm-form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, FolderKanban } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { RolePicker } from "@/components/resume/role-picker";
import { SkillsEditor } from "@/components/resume/skills-editor";
import { Aurora } from "@/components/ui/aurora";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { EXPERIENCE_OPTIONS } from "@/lib/constants";
import { parseNext, pathAfterResume, withNext } from "@/lib/resume-flow";
import {
  confirmFormSchema,
  experienceLevelSchema,
  type ConfirmForm,
  type ExperienceLevel,
} from "@/lib/schemas";
import { useResumeStore } from "@/stores/resume-store";

function initialValues(): ConfirmForm {
  const parsed = useResumeStore.getState().parsed;
  const experience = experienceLevelSchema.safeParse(parsed?.experience_level).success
    ? (parsed?.experience_level as ExperienceLevel)
    : "student";
  return {
    target_role: parsed?.target_role ?? "",
    experience_level: experience,
    skills: parsed?.skills ?? [],
  };
}

export function ConfirmForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = parseNext(searchParams.get("next"));

  // Manual mode is decided on arrival: the store had no parsed resume.
  const [manual] = useState(() => useResumeStore.getState().parsed === null);
  const [defaults] = useState(initialValues);
  const storedParsed = useResumeStore((s) => s.parsed);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ConfirmForm>({
    resolver: zodResolver(confirmFormSchema),
    mode: "onTouched",
    defaultValues: defaults,
  });

  useEffect(() => {
    const store = useResumeStore.getState();
    if (store.parsed === null) store.setManualInput({ skills: [], targetRole: null });
  }, []);

  const skills = useWatch({ control, name: "skills" }) ?? defaults.skills;
  const role = useWatch({ control, name: "target_role" }) ?? defaults.target_role;
  const experience = useWatch({ control, name: "experience_level" }) ?? defaults.experience_level;

  const roleValue = role.trim();
  const valid = confirmFormSchema.safeParse({
    target_role: role,
    experience_level: experience,
    skills,
  }).success;

  const disabledReason =
    roleValue.length < 2
      ? "Enter your target role"
      : roleValue.length > 60
        ? "Keep your target role under 60 characters"
        : skills.length === 0
          ? "Add at least one skill"
          : null;

  const roleSource =
    roleValue.length === 0
      ? null
      : storedParsed === null || roleValue !== (storedParsed.target_role ?? "")
        ? "manual"
        : storedParsed.role_source;

  const projects = storedParsed?.projects ?? [];

  const onSubmit = handleSubmit((values) => {
    const store = useResumeStore.getState();
    const initialSkills = store.parsed?.skills ?? [];
    const initialRole = store.parsed?.target_role ?? null;

    const skillsChanged =
      values.skills.length !== initialSkills.length ||
      values.skills.some((skill, index) => skill !== initialSkills[index]);

    // Commit only on Continue, and only when the order-sensitive list really changed.
    if (skillsChanged) store.setSkills(values.skills);
    if (values.target_role !== initialRole) store.setTargetRole(values.target_role);
    store.setExperienceLevel(values.experience_level);

    router.push(pathAfterResume(next));
  });

  return (
    <section className="relative isolate w-full pb-10 pt-10 md:pt-14">
      <Aurora />
      <div className="mx-auto w-full max-w-300 px-4 md:px-10">
        <Link
          href={withNext("/resume", next)}
          className="inline-flex min-h-12 items-center gap-1.5 text-sm font-semibold text-brand-violet underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back
        </Link>

        <div className="mt-3 max-w-2xl">
          <h1 className="font-display text-3xl font-bold text-ink md:text-4xl">
            {manual ? "Tell us about yourself" : "Check your details"}
          </h1>
          <p className="mt-3 text-base text-slate-dark">
            {manual
              ? "Add the skills and the role you want to practise for."
              : "We read these from your resume. Adjust anything before continuing."}
          </p>
        </div>

        <form onSubmit={onSubmit} noValidate className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <GlassCard className="p-6">
              <h2 className="mb-2 font-display text-xl font-bold text-ink">Your skills</h2>
              <SkillsEditor
                skills={skills}
                onChange={(nextSkills) =>
                  setValue("skills", nextSkills, { shouldValidate: true, shouldDirty: true })
                }
                error={errors.skills?.message}
              />
            </GlassCard>

            <GlassCard className="space-y-6 p-6">
              <Controller
                control={control}
                name="target_role"
                render={({ field, fieldState }) => (
                  <RolePicker
                    name={field.name}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    roleSource={roleSource}
                    error={fieldState.error?.message}
                  />
                )}
              />

              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-dark">Experience level</p>
                <SegmentedControl
                  options={EXPERIENCE_OPTIONS}
                  value={experience}
                  onChange={(level) =>
                    setValue("experience_level", level, { shouldValidate: true, shouldDirty: true })
                  }
                  ariaLabel="Experience level"
                />
              </div>

              {projects.length > 0 ? (
                <div className="rounded-xl bg-mint-soft p-4">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <FolderKanban className="size-4 text-emerald-dark" aria-hidden />
                    Projects found
                  </h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-dark">
                    {projects.map((project, index) => (
                      <li key={`${project}-${index}`}>{project}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </GlassCard>
          </div>

          <div className="sticky bottom-0 z-20 -mx-4 mt-6 bg-white/90 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-md lg:static lg:mx-0 lg:mt-8 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-end">
              {disabledReason ? (
                <p id="continue-hint" className="text-sm text-slate-dark lg:mr-2">
                  {disabledReason} to continue.
                </p>
              ) : null}
              <Button
                type="submit"
                size="lg"
                disabled={!valid}
                aria-describedby={disabledReason ? "continue-hint" : undefined}
                className="w-full lg:w-auto lg:min-w-56"
              >
                Continue
              </Button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
