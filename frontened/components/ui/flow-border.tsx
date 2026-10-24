// src/components/ui/flow-border.tsx
import type { CSSProperties, ElementType, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const SPEED = { slow: "10s", base: "6s", fast: "3s" } as const;

interface FlowBorderProps extends HTMLAttributes<HTMLElement> {
  as?: "div" | "section" | "article" | "li" | "label";
  radius?: number;                 // px
  width?: number;                  // px
  speed?: keyof typeof SPEED;
  tone?: "brand" | "deep";         // deep = darker stops for 3:1 on white (inputs, small controls)
  motion?: "always" | "hover";     // hover = flows only on hover/focus
  invalid?: boolean;
}

export function FlowBorder({
  as = "div",
  radius = 16,
  width = 2,
  speed = "base",
  tone = "brand",
  motion = "always",
  invalid = false,
  className,
  style,
  children,
  ...rest
}: FlowBorderProps) {
  const Tag = as as ElementType;
  return (
    <Tag
      className={cn(
        "flow-border",
        tone === "deep" && "flow-deep",
        motion === "hover" && "flow-on-hover",
        invalid && "flow-invalid",
        className
      )}
      style={
        {
          "--flow-radius": `${radius}px`,
          "--flow-width": `${width}px`,
          "--flow-speed": SPEED[speed],
          ...style,
        } as CSSProperties
      }
      {...rest}
    >
      {children}
    </Tag>
  );
}