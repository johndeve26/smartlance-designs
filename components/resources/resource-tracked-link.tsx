"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { trackEvent, type AnalyticsEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type ResourceTrackedLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  event: AnalyticsEvent;
  payload?: Record<string, string | number | boolean | undefined>;
  ariaLabel?: string;
};

export function ResourceTrackedLink({
  href,
  children,
  className,
  event,
  payload = {},
  ariaLabel,
}: ResourceTrackedLinkProps) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={cn(className)}
      onClick={() => {
        trackEvent(event, { href, ...payload });
      }}
    >
      {children}
    </Link>
  );
}
