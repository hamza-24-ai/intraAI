// components/auth/form-field.tsx
"use client";

import { AlertCircle } from "lucide-react";
import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function FormField({ label, error, hint, children }: FormFieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const injected: Record<string, unknown> = { id, "aria-describedby": describedBy };
  if (error) injected["aria-invalid"] = true;

  const control = isValidElement<Record<string, unknown>>(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, injected)
    : children;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-dark">
        {label}
      </label>
      {control}
      {hint ? (
        <p id={hintId} className="text-sm text-slate-dark">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="flex items-start gap-1.5 text-sm font-medium text-error">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
