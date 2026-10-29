// components/resume/role-picker.tsx
"use client";

import { AlertCircle } from "lucide-react";
import { useId } from "react";
import { RoleSourceBadge } from "@/components/resume/role-source-badge";
import { Button } from "@/components/ui/button";
import { FlowInput } from "@/components/ui/flow-input";
import { ROLE_SUGGESTIONS } from "@/lib/constants";

interface RolePickerProps {
  name: string;
  value: string;
  roleSource: string | null;
  error?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}

export function RolePicker({ name, value, roleSource, error, onChange, onBlur }: RolePickerProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hintId, error ? errorId : null].filter(Boolean).join(" ");

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={id} className="text-sm font-medium text-slate-dark">
          Target role
        </label>
        <RoleSourceBadge source={roleSource} />
      </div>

      <FlowInput
        id={id}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        invalid={Boolean(error)}
        aria-describedby={describedBy}
        maxLength={60}
        autoComplete="organization-title"
        placeholder="e.g. Frontend Developer"
      />

      <p id={hintId} className="text-sm text-slate-dark">
        Choose a suggestion or type your own.
      </p>

      <div role="group" aria-label="Role suggestions" className="flex flex-wrap gap-2 pt-1">
        {ROLE_SUGGESTIONS.map((role) => (
          <Button
            key={role}
            type="button"
            variant="outline"
            size="sm"
            className="h-11"
            aria-pressed={value === role}
            onClick={() => onChange(role)}
          >
            {role}
          </Button>
        ))}
      </div>

      {error ? (
        <p id={errorId} className="flex items-start gap-1.5 text-sm font-medium text-error">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
