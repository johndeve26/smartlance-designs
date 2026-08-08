"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Heading = { id: string; text: string };

type ArticleTocProps = {
  headings: Heading[];
  variant?: "mobile" | "desktop";
};

export function ArticleToc({
  headings,
  variant = "desktop",
}: ArticleTocProps) {
  const [activeId, setActiveId] = useState(headings[0]?.id ?? "");

  useEffect(() => {
    if (headings.length === 0) return;

    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          );
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-20% 0px -65% 0px",
        threshold: [0, 1],
      },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 3) return null;

  if (variant === "mobile") {
    return (
      <details className="rounded-xl border border-border bg-surface">
        <summary className="cursor-pointer list-none px-5 py-4 font-display text-lg font-semibold [&::-webkit-details-marker]:hidden">
          On this page
        </summary>
        <TocList
          headings={headings}
          activeId={activeId}
          className="border-t border-border px-5 pb-5 pt-3"
        />
      </details>
    );
  }

  return (
    <nav aria-label="Table of contents">
      <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-subtle">
        On this page
      </p>
      <TocList headings={headings} activeId={activeId} className="mt-4" />
    </nav>
  );
}

function TocList({
  headings,
  activeId,
  className,
}: {
  headings: Heading[];
  activeId: string;
  className?: string;
}) {
  return (
    <ol className={cn("space-y-1", className)}>
      {headings.map((heading, index) => {
        const active = heading.id === activeId;
        return (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className={cn(
                "group flex gap-3 rounded-md px-2 py-2 text-[0.9375rem] leading-snug transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                active
                  ? "bg-orange-50 font-medium text-accent-text"
                  : "text-muted hover:bg-surface-muted hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "font-display text-xs font-semibold tabular-nums",
                  active ? "text-accent-text" : "text-subtle",
                )}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{heading.text}</span>
            </a>
          </li>
        );
      })}
    </ol>
  );
}

export function ArticleCopyLink() {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        } catch {
          setCopied(false);
        }
      }}
      className="text-[0.9375rem] font-medium text-muted transition-colors hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      {copied ? "Link copied" : "Copy link"}
    </button>
  );
}
