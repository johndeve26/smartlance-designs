import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

/**
 * Site layout container — prefer these sizes over one-off max-w wrappers.
 *
 * All sizes share the shell (1280px) so header, breadcrumbs, and body use the
 * same left and right edges. Size names remain for API clarity / docs; they
 * no longer inset a narrower centered column.
 *
 * Short headline/deck measures use local max-w-* on the copy itself.
 *
 * `narrow` boolean is a deprecated alias for size="reading".
 */
export type ContainerSize = "default" | "reading" | "narrow" | "interactive";

type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  size?: ContainerSize;
  /** @deprecated Prefer size="reading" */
  narrow?: boolean;
};

export function Container({
  children,
  className,
  size,
  narrow,
  ...props
}: ContainerProps) {
  // size / narrow kept for call-site API compatibility; both map to shell.
  void size;
  void narrow;

  return (
    <div className={cn("container-site", className)} {...props}>
      {children}
    </div>
  );
}
