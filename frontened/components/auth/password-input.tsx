// components/auth/password-input.tsx
"use client";

import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useState, type ComponentProps } from "react";
import { FlowInput } from "@/components/ui/flow-input";

type PasswordInputProps = Omit<ComponentProps<typeof FlowInput>, "type">;

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, disabled, ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <FlowInput
        ref={ref}
        type={visible ? "text" : "password"}
        className={className}
        disabled={disabled}
        {...props}
        trailing={
          <button
            type="button"
            aria-pressed={visible}
            aria-label={visible ? "Hide password" : "Show password"}
            disabled={disabled}
            onClick={() => setVisible((value) => !value)}
            className="flex size-11 items-center justify-center rounded-lg text-slate-dark transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            {visible ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
          </button>
        }
      />
    );
  }
);
PasswordInput.displayName = "PasswordInput";
