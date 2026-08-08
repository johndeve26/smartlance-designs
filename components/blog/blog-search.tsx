"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { BlogPostMeta } from "@/types";

type BlogSearchProps = {
  posts: Pick<BlogPostMeta, "slug" | "title" | "description" | "category">[];
};

export function BlogSearch({ posts }: BlogSearchProps) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return posts
      .filter((post) => {
        const haystack = `${post.title} ${post.description} ${post.category}`.toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 8);
  }, [posts, query]);

  const showResults = query.trim().length >= 2;

  return (
    <div className="relative">
      <label htmlFor="blog-search" className="sr-only">
        Search articles
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle"
          aria-hidden
        />
        <input
          id="blog-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search articles"
          autoComplete="off"
          className="h-10 w-full rounded-full border border-border bg-surface pl-10 pr-4 text-[0.9375rem] text-foreground outline-none transition-colors placeholder:text-subtle hover:border-foreground/20 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/25"
        />
      </div>
      {showResults ? (
        <div
          role="listbox"
          aria-label="Search results"
          className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
        >
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted">No matching articles.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((post) => (
                <li key={post.slug}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="block px-4 py-3 hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none"
                    onClick={() => setQuery("")}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-accent-text">
                      {post.category}
                    </p>
                    <p className="mt-1 text-[0.9375rem] font-medium leading-snug text-foreground">
                      {post.title}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
