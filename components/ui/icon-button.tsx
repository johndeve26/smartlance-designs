import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

const sizes = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
  lg: "h-10 w-10",
} as const;

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: keyof typeof sizes;
  label: string;
  children: ReactNode;
};

export function IconButton({
  className,
  size = "md",
  label,
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-foreground transition-colors",
        "hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
