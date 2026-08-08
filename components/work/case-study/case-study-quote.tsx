"use client";

import { useState } from "react";
import { Container } from "@/components/ui/container";

/** Aim for roughly 40–80 words visible before expand */
const EXCERPT_WORDS = 55;

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function excerptWords(text: string, max = EXCERPT_WORDS) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= max) return text.trim();
  return `${words.slice(0, max).join(" ")}…`;
}

export function CaseStudyQuote({
  quote,
  name,
  role,
}: {
  quote: string;
  name: string;
  role?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const long = wordCount(quote) > EXCERPT_WORDS || quote.trim().length > 320;
  const display = long && !expanded ? excerptWords(quote) : quote;

  return (
    <section className="bg-surface-dark py-14 text-white sm:py-16 lg:py-[4.5rem]">
      <Container>
          <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-orange-300">
            Client feedback
          </p>
          <blockquote className="mt-6 font-display text-[clamp(1.5rem,2.8vw,2.25rem)] font-medium leading-[1.35] text-white">
            “{display}”
          </blockquote>
          {long ? (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="mt-5 text-base font-semibold text-orange-300 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-expanded={expanded}
            >
              {expanded ? "Show less" : "Read full feedback"}
            </button>
          ) : null}
          <footer className="mt-8 text-base text-white/70 sm:text-[1.0625rem]">
            <cite className="not-italic font-semibold text-white">{name}</cite>
            {role ? <span className="mt-1.5 block">{role}</span> : null}
          </footer>
      </Container>
    </section>
  );
}
