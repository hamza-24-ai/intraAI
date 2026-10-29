// components/resume/resume-dropzone.tsx
"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlowBorder } from "@/components/ui/flow-border";
import { useMediaQuery } from "@/hooks/use-media-query";
import { formatFileSize } from "@/lib/resume-errors";
import { MAX_RESUME_BYTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ResumeDropzoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export function ResumeDropzone({ onFile, disabled = false }: ResumeDropzoneProps) {
  const coarse = useMediaQuery("(pointer: coarse)");
  const narrow = useMediaQuery("(max-width: 639px)");
  const compact = coarse || narrow;

  const onDrop = useCallback(
    (files: File[]) => {
      const file = files[0]; // if several files are dropped, use the first
      if (file) onFile(file);
    },
    [onFile]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    multiple: false,
    disabled,
    noClick: compact,
    noKeyboard: compact,
  });

  return (
    <FlowBorder
      radius={20}
      width={2}
      tone="deep"
      motion="hover"
      speed={isDragActive ? "fast" : "base"}
      className={cn("bg-white transition-colors", isDragActive && "bg-violet-light")}
    >
      <div
        {...getRootProps({
          role: compact ? "group" : "button",
          "aria-label": compact ? undefined : "Choose your resume file",
          className: cn(
            "flex min-h-[260px] w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-[20px] px-6 py-10 text-center",
            compact && "cursor-default"
          ),
        })}
      >
        <input {...getInputProps({ accept: ".pdf,.docx", "aria-label": "Resume file" })} />

        <span className="inline-flex size-16 items-center justify-center rounded-full bg-violet-light text-brand-violet">
          <UploadCloud className="size-8" aria-hidden />
        </span>

        {isDragActive ? (
          <p className="text-lg font-semibold text-brand-violet">Release to upload</p>
        ) : (
          <>
            <div className="space-y-1">
              <p className="text-lg font-semibold text-ink">
                {compact ? "Upload your resume" : "Drop your resume or browse"}
              </p>
              <p className="text-sm text-slate-dark">
                PDF or DOCX · up to {formatFileSize(MAX_RESUME_BYTES)}
              </p>
            </div>
            {compact ? (
              <Button
                type="button"
                size="lg"
                className="w-full sm:w-auto"
                onClick={(event) => {
                  event.stopPropagation();
                  open();
                }}
              >
                Browse files
              </Button>
            ) : null}
          </>
        )}
      </div>
    </FlowBorder>
  );
}
