import { cn } from "@/lib/utils";
import { Slot } from "./slot";
import type { ButtonHTMLAttributes, ReactNode } from "react";

const variants = {
  /** Accessible darker orange fill + white text (WCAG AA) */
  primary:
    "bg-cta text-cta-foreground hover:bg-cta-hover shadow-sm",
  secondary:
    "bg-primary text-primary-foreground hover:bg-neutral-700",
  outline:
    "border border-border-strong bg-surface text-foreground hover:border-accent hover:text-accent-text hover:bg-brand-soft",
  ghost:
    "bg-transparent text-foreground hover:bg-surface-muted hover:text-accent-text",
  dark: "bg-surface-dark text-white hover:bg-neutral-800",
} as const;

const sizes = {
  sm: "h-9 px-3.5 text-sm rounded-md",
  md: "h-11 px-5 text-sm rounded-md",
  lg: "h-12 px-6 text-base rounded-lg",
} as const;

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  asChild?: boolean;
  children: ReactNode;
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  asChild = false,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );

  if (asChild) {
    return <Slot className={classes}>{children}</Slot>;
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
