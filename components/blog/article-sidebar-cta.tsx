"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import type { ArticleCtaCopy } from "@/lib/article-cta";

type ArticleSidebarCtaProps = {
  cta: ArticleCtaCopy;
};

export function ArticleSidebarCta({ cta }: ArticleSidebarCtaProps) {
  return (
    <aside className="border-t border-border pt-6">
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent-text">
        Related service
      </p>
      <p className="mt-2.5 font-display text-lg font-semibold leading-snug text-foreground">
        {cta.sidebarTitle}
      </p>
      <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
        {cta.sidebarBody}
      </p>
      <div className="mt-4 space-y-2.5">
        <div>
          <Link
            href={cta.sidebarPrimaryHref}
            onClick={() =>
              trackEvent("blog_service_cta_clicked", {
                href: cta.sidebarPrimaryHref,
              })
            }
            className="group inline-flex items-center gap-1.5 text-[0.9375rem] font-semibold text-accent-text hover:underline"
          >
            {cta.sidebarPrimaryLabel}
            <span
              aria-hidden
              className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            >
              →
            </span>
          </Link>
        </div>
        <div>
          <Link
            href="/free-website-review"
            className="text-[0.9375rem] font-medium text-muted hover:text-accent-text hover:underline"
          >
            Get a Free Website Review →
          </Link>
        </div>
      </div>
    </aside>
  );
}
