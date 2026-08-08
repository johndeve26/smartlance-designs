"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { trackEvent, type AnalyticsEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SolutionCtaLinkProps = {
  href: string;
  label: string;
  slug: string;
  variant?: "primary" | "outline" | "secondary";
  size?: "md" | "lg";
  className?: string;
  event?: AnalyticsEvent;
  location?: string;
};

export function SolutionCtaLink({
  href,
  label,
  slug,
  variant = "primary",
  size = "lg",
  className,
  event = "solution_cta_clicked",
  location = "solution-detail",
}: SolutionCtaLinkProps) {
  const isFreeReview = href.includes("free-website-review");

  return (
    <Button asChild size={size} variant={variant} className={className}>
      <Link
        href={href}
        onClick={() => {
          trackEvent(event, { slug, location, href });
          if (isFreeReview) {
            trackEvent("free_review_clicked", { location, slug });
          }
        }}
      >
        {label}
      </Link>
    </Button>
  );
}

type SolutionTextLinkProps = {
  href: string;
  slug: string;
  children: ReactNode;
  className?: string;
};

export function SolutionServiceLink({
  href,
  slug,
  children,
  className,
}: SolutionTextLinkProps) {
  return (
    <Link
      href={href}
      className={cn(className)}
      onClick={() => {
        trackEvent("solution_service_clicked", { slug, href });
      }}
    >
      {children}
    </Link>
  );
}
