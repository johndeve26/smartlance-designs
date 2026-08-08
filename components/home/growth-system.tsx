import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export type GrowthSystemStep = {
  title: string;
  description: string;
};

export function GrowthSystemSection({
  steps,
}: {
  steps: GrowthSystemStep[];
}) {
  if (!steps.length) return null;

  return (
    <section className="section-padding-feature bg-surface">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.46fr)_minmax(0,0.54fr)] lg:items-start lg:gap-16 xl:gap-24">
          <div className="lg:sticky lg:top-32">
            <p className="eyebrow">The Smartlance approach</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              We Don&apos;t Design First and Think About SEO Later.
            </h2>
            <p className="section-deck mt-5 max-w-[40ch]">
              Website architecture affects SEO. Performance affects experience.
              Content affects rankings. Design affects conversion. Analytics
              informs improvement — so they belong in one connected system.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild variant="outline">
                <Link href="/seo">See how SEO fits in</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/platforms">Explore Platforms</Link>
              </Button>
            </div>
          </div>

          {/* Connected sequence: one continuous rule, quiet ordinals, clear titles */}
          <ol className="relative border-l border-border pl-8 sm:pl-10">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="relative pb-9 last:pb-0"
              >
                <span
                  className="absolute -left-[calc(2rem+0.3125rem)] top-[0.5rem] h-2.5 w-2.5 rounded-full border border-accent bg-surface sm:-left-[calc(2.5rem+0.3125rem)]"
                  aria-hidden
                />
                <p className="flex items-baseline gap-3">
                  <span className="ordinal-marker">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="font-display text-[1.375rem] font-semibold leading-tight text-foreground sm:text-2xl">
                    {step.title}
                  </span>
                </p>
                <p className="body-copy mt-2 sm:pl-[2.375rem]">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
