import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { RedesignLifecycleVisual } from "@/components/guides/guide-visuals";
import type { GuideContent } from "@/data/resource-content-types";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type GuideHeroProps = {
  guide: GuideContent;
};

export function GuideHero({ guide }: GuideHeroProps) {
  return (
    <header className="border-b border-border bg-surface">
      <Container className="pt-8 pb-9 sm:pb-11">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Resources", href: "/resources" },
            { label: "Guides", href: "/guides" },
            { label: guide.title },
          ]}
        />

        <div className="mt-7">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-text">
            Guide
          </p>

          <h1 className="mt-3.5 max-w-[40rem] font-display text-[clamp(2.25rem,4.2vw,4.25rem)] font-semibold leading-[1.06] tracking-tight text-foreground sm:max-w-[46rem]">
            {guide.title}
          </h1>

          {guide.deck ? (
            <p className="mt-5 max-w-2xl text-[1.0625rem] leading-relaxed text-muted sm:text-lg sm:leading-[1.65]">
              {guide.deck}
            </p>
          ) : (
            <p className="mt-5 max-w-2xl text-[1.0625rem] leading-relaxed text-muted sm:text-lg sm:leading-[1.65]">
              {guide.description}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
            <span className="font-medium text-foreground">
              {guide.author?.trim() || "Smartlance Designs"}
            </span>
            <span aria-hidden className="text-subtle">
              ·
            </span>
            <time dateTime={guide.publishedAt}>
              {formatDate(guide.publishedAt)}
            </time>
            {guide.updatedAt ? (
              <>
                <span aria-hidden className="text-subtle">
                  ·
                </span>
                <span>Updated {formatDate(guide.updatedAt)}</span>
              </>
            ) : null}
            {guide.readingTime ? (
              <>
                <span aria-hidden className="text-subtle">
                  ·
                </span>
                <span>{guide.readingTime}</span>
              </>
            ) : null}
          </div>
        </div>

        <div className="mt-9 max-w-5xl sm:mt-10">
          <RedesignLifecycleVisual className="!my-0" />
        </div>
      </Container>
    </header>
  );
}
