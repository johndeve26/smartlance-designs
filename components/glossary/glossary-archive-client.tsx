"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { GlossaryTopicGroup } from "@/data/resource-content-types";
import { cn } from "@/lib/utils";

export type GlossarySearchItem = {
  slug: string;
  term: string;
  acronym?: string;
  expansion?: string;
  aliases: string[];
  shortDefinition: string;
  topicGroup: GlossaryTopicGroup;
  topicLabel: string;
};

type GlossaryArchiveClientProps = {
  items: GlossarySearchItem[];
  featured: GlossarySearchItem[];
  alphabetical: { letter: string; terms: GlossarySearchItem[] }[];
  topicGroups: {
    id: GlossaryTopicGroup;
    label: string;
    description: string;
    terms: GlossarySearchItem[];
  }[];
};

export function GlossaryArchiveClient({
  items,
  featured,
  alphabetical,
  topicGroups,
}: GlossaryArchiveClientProps) {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!normalized) return null;
    return items.filter((item) => {
      const haystack = [
        item.term,
        item.acronym,
        item.expansion,
        item.shortDefinition,
        ...item.aliases,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [items, normalized]);

  const searching = Boolean(normalized);

  return (
    <div className="space-y-14 sm:space-y-16">
      <div>
        <label htmlFor="glossary-search" className="sr-only">
          Search glossary terms
        </label>
        <input
          id="glossary-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search glossary terms…"
          autoComplete="off"
          className="h-12 w-full max-w-xl rounded-lg border border-border bg-surface px-4 text-base text-foreground placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
        {searching ? (
          <p className="mt-3 text-sm text-muted">
            {results && results.length > 0
              ? `${results.length} matching ${results.length === 1 ? "term" : "terms"}`
              : "No matching glossary term yet."}
          </p>
        ) : null}
      </div>

      {searching ? (
        results && results.length > 0 ? (
          <TermList items={results} />
        ) : (
          <div className="rounded-xl border border-border bg-surface-muted px-5 py-6">
            <p className="text-base text-muted">
              No matching glossary term yet.
            </p>
            <Link
              href="/resources"
              className="mt-3 inline-flex items-center gap-1.5 text-base font-semibold text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Browse Resources
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )
      ) : (
        <>
          {featured.length > 0 ? (
            <section>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
                Foundational Terms
              </h2>
              <p className="mt-2 max-w-2xl text-base text-muted">
                A short starting set for planning websites, SEO and conversion.
              </p>
              <TermList items={featured} className="mt-6" />
            </section>
          ) : null}

          <section>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
              Browse by Letter
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {alphabetical.map((group) => (
                <a
                  key={group.letter}
                  href={`#letter-${group.letter === "#" ? "num" : group.letter.toLowerCase()}`}
                  className="inline-flex h-10 min-w-10 items-center justify-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-foreground hover:border-accent/40 hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {group.letter}
                </a>
              ))}
            </div>
            <div className="mt-8 space-y-10">
              {alphabetical.map((group) => (
                <div
                  key={group.letter}
                  id={`letter-${group.letter === "#" ? "num" : group.letter.toLowerCase()}`}
                  className="scroll-mt-28"
                >
                  <h3 className="font-display text-xl font-semibold text-foreground">
                    {group.letter === "#" ? "0–9" : group.letter}
                  </h3>
                  <TermList items={group.terms} className="mt-4" />
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
              Browse by Topic
            </h2>
            <div className="mt-8 space-y-10">
              {topicGroups.map((group) => (
                <div key={group.id} id={`topic-${group.id}`} className="scroll-mt-28">
                  <h3 className="font-display text-xl font-semibold text-foreground">
                    {group.label}
                  </h3>
                  <p className="mt-1.5 text-[0.9375rem] text-muted">
                    {group.description}
                  </p>
                  <TermList items={group.terms} className="mt-4" />
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function TermList({
  items,
  className,
}: {
  items: GlossarySearchItem[];
  className?: string;
}) {
  return (
    <ul className={cn("divide-y divide-border border-y border-border", className)}>
      {items.map((item) => (
        <li key={item.slug}>
          <Link
            href={`/glossary/${item.slug}`}
            className="group flex flex-col gap-2 py-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:flex-row sm:items-start sm:justify-between sm:gap-8"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-display text-xl font-semibold text-foreground transition-colors group-hover:text-accent-text sm:text-[1.375rem]">
                  {item.term}
                </span>
                {item.expansion ? (
                  <span className="text-sm text-subtle">{item.expansion}</span>
                ) : null}
              </div>
              <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {item.shortDefinition}
              </p>
              {item.topicLabel ? (
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent-text">
                  {item.topicLabel}
                </p>
              ) : null}
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-accent-text">
              View Definition
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-[2px] motion-reduce:transition-none" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
