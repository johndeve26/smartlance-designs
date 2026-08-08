import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export function HomeSeoSection({ highlights }: { highlights: string[] }) {
  if (!highlights.length) return null;

  return (
    <section className="section-padding bg-surface-muted">
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-16 xl:gap-20">
          <div className="max-w-xl">
            <p className="eyebrow">SEO</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              Your Customers Are Searching. Can They Find You?
            </h2>
            <p className="section-deck mt-5 max-w-[40ch]">
              SEO works best when the website is ready for it — clear structure,
              technical foundations and pages that convert the traffic you earn.
            </p>
            <Button asChild variant="outline" className="mt-8">
              <Link href="/seo">Explore SEO Services</Link>
            </Button>
          </div>

          <div>
            <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-muted">
              Core capabilities
            </p>
            <ul className="mt-5 divide-y divide-border border-y border-border">
              {highlights.map((item, index) => (
                <li key={item} className="flex items-baseline gap-4 py-4">
                  <span className="ordinal-marker">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="font-display text-[1.125rem] font-semibold text-foreground sm:text-[1.1875rem]">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-6">
              <Link href="/seo/seo-audit" className="link-action">
                Request an SEO audit →
              </Link>
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
