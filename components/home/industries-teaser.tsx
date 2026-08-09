import Link from "next/link";
import { Container } from "@/components/ui/container";
import type { Industry } from "@/types";
import { industries as typedIndustries } from "@/data/industries";

type HomeIndustriesTeaserProps = {
  industries?: Industry[];
};

/**
 * Compact homepage industries signal — curated subset with context,
 * not a directory dump. Links to the hub for the full catalog.
 */
export function HomeIndustriesTeaser({
  industries = typedIndustries,
}: HomeIndustriesTeaserProps) {
  const featured = [...industries]
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return a.name.localeCompare(b.name);
    })
    .slice(0, 6);
  if (featured.length === 0) return null;

  return (
    <section className="section-padding bg-surface">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.38fr)_minmax(0,0.62fr)] lg:gap-16 xl:gap-20">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <p className="eyebrow">Industries</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              Business Contexts We Understand
            </h2>
            <p className="section-deck mt-5 max-w-[36ch]">
              Hospitality, property, local services and more — clarity,
              discoverability and conversion still come first.
            </p>
            <p className="mt-8 border-t border-border pt-6">
              <Link href="/industries" className="link-action">
                Explore All Industries →
              </Link>
            </p>
          </div>

          <ul className="divide-y divide-border border-y border-border">
            {featured.map((industry) => (
              <li key={industry.slug}>
                <Link
                  href={`/industries/${industry.slug}`}
                  className="group grid gap-1.5 py-5 transition-colors sm:grid-cols-[minmax(0,0.36fr)_minmax(0,0.64fr)] sm:items-baseline sm:gap-8"
                >
                  <span className="font-display text-[1.125rem] font-semibold text-foreground transition-colors group-hover:text-accent-text sm:text-[1.1875rem]">
                    {industry.name}
                  </span>
                  <span className="text-[0.9375rem] leading-[1.65] text-muted">
                    {industry.description}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
