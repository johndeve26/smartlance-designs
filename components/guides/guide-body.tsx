import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BlogMarkdown } from "@/components/blog/blog-markdown";
import { GuideVisual } from "@/components/guides/guide-visuals";
import type { GuideContent } from "@/data/resource-content-types";
import { cn } from "@/lib/utils";

type GuideBodyProps = {
  guide: GuideContent;
};

export function GuideBody({ guide }: GuideBodyProps) {
  return (
    <div className="prose-smartlance">
      <p className="lead text-lg leading-relaxed text-muted sm:text-[1.125rem]">
        {guide.intro}
      </p>

      {guide.sections.map((section) => (
        <section key={section.id} className="scroll-mt-28">
          <h2 id={section.id} className="scroll-mt-28">
            {section.title}
          </h2>
          {section.visual ? (
            <GuideVisual visual={section.visual} wide={section.wideVisual} />
          ) : null}
          <BlogMarkdown content={section.body} />
        </section>
      ))}
    </div>
  );
}

type GuideCardProps = {
  guide: GuideContent;
  variant?: "featured" | "compact";
  className?: string;
};

export function GuideCard({
  guide,
  variant = "compact",
  className,
}: GuideCardProps) {
  const featured = variant === "featured";

  return (
    <article className={cn("group flex flex-col", className)}>
      <Link
        href={`/guides/${guide.slug}`}
        aria-label={`Explore guide: ${guide.title}`}
        className={cn(
          "relative block overflow-hidden rounded-xl border border-border bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          featured ? "aspect-[16/10] sm:aspect-[2/1]" : "aspect-[16/10]",
        )}
      >
        <GuideCardCover />
      </Link>

      <div className={cn("flex flex-1 flex-col", featured ? "pt-6 sm:pt-7" : "pt-5")}>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-text">
          Guide
        </p>
        <h3
          className={cn(
            "mt-2.5 font-display font-semibold leading-snug text-foreground",
            featured
              ? "text-[1.5rem] sm:text-3xl lg:text-[2rem]"
              : "text-[1.25rem] sm:text-[1.375rem]",
          )}
        >
          <Link
            href={`/guides/${guide.slug}`}
            className="transition-colors hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {guide.title}
          </Link>
        </h3>
        <p
          className={cn(
            "mt-3 leading-relaxed text-muted",
            featured
              ? "line-clamp-3 text-base sm:text-[1.0625rem]"
              : "line-clamp-2 text-[0.9375rem] sm:text-base",
          )}
        >
          {guide.description}
        </p>
        <div className="mt-3 text-[0.875rem] text-subtle sm:text-[0.9375rem]">
          <time dateTime={guide.publishedAt}>
            {new Date(guide.publishedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </time>
          {guide.readingTime ? (
            <>
              <span aria-hidden> · </span>
              <span>{guide.readingTime}</span>
            </>
          ) : null}
        </div>
        <Link
          href={`/guides/${guide.slug}`}
          className={cn(
            "group/link inline-flex items-center gap-1.5 pt-5 text-base font-semibold text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            "mt-auto",
          )}
        >
          Explore Guide
          <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-[3px] motion-reduce:transition-none" />
        </Link>
      </div>
    </article>
  );
}

function GuideCardCover() {
  return (
    <div className="absolute inset-0 bg-[#F3EEE8]" aria-hidden>
      <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(244,122,72,0.12)_0%,transparent_55%)]" />
      <div className="absolute left-5 top-5 rounded-md border border-[#D9CFC5] bg-white/80 px-2.5 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-accent-text">
        Guide
      </div>
      <div className="absolute bottom-6 left-5 right-5 space-y-2">
        <div className="h-2 w-[72%] rounded-full bg-[#D9CFC5]/90" />
        <div className="h-2 w-[48%] rounded-full bg-[#D9CFC5]/70" />
        <div className="mt-4 flex gap-2">
          {["Audit", "Structure", "Launch"].map((label) => (
            <span
              key={label}
              className="rounded border border-[#D4C8BC] bg-white/70 px-2 py-1 text-[0.625rem] font-semibold uppercase tracking-wider text-[#57534E]"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
      <div className="absolute right-6 top-14 h-20 w-20 rounded-full border border-orange-200/90" />
    </div>
  );
}
