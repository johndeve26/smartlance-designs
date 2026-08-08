import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

type SectionProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  tone?: "default" | "muted" | "dark" | "surface";
  id?: string;
};

const tones = {
  default: "bg-background",
  muted: "bg-surface-muted",
  dark: "bg-surface-dark text-white",
  surface: "bg-surface",
} as const;

export function Section({
  children,
  className,
  tone = "default",
  id,
  ...props
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn("section-padding", tones[tone], className)}
      {...props}
    >
      {children}
    </section>
  );
}
