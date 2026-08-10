import { Badge } from "@/components/ui/badge";
import {
  getStatusPresentation,
  type StatusAudience,
  type StatusDomain,
} from "@/lib/ui/status";
import type { StatusTone } from "@/lib/ui/tokens";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const toneMap: Record<StatusTone, "default" | "accent" | "success" | "warning" | "placeholder"> = {
  neutral: "default",
  info: "accent",
  success: "success",
  warning: "warning",
  danger: "placeholder",
  active: "accent",
};

type StatusBadgeProps = {
  domain: StatusDomain;
  value: string;
  audience?: StatusAudience;
  className?: string;
  children?: ReactNode;
};

export function StatusBadge({
  domain,
  value,
  audience = "admin",
  className,
  children,
}: StatusBadgeProps) {
  const { label, tone } = getStatusPresentation(domain, value, audience);
  return (
    <Badge tone={toneMap[tone]} className={cn("rounded-full px-2.5 py-0.5", className)}>
      {children ?? label}
    </Badge>
  );
}

type SemanticBadgeProps = {
  tone: StatusTone;
  children: ReactNode;
  className?: string;
};

export function SemanticBadge({ tone, children, className }: SemanticBadgeProps) {
  return (
    <Badge tone={toneMap[tone]} className={cn("rounded-full px-2.5 py-0.5", className)}>
      {children}
    </Badge>
  );
}
