import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export type ReviewChecklistItem = {
  label: string;
  detail: string;
};

export function FreeReviewTeaser({
  checklist,
}: {
  checklist: ReviewChecklistItem[];
}) {
  if (!checklist.length) return null;

  return (
    <section className="section-padding-feature bg-surface-dark text-white">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:items-center lg:gap-16 xl:gap-24">
          <div className="max-w-xl">
            <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-orange-300">
              Free website review
            </p>
            <h2 className="heading-section mt-3 font-display font-semibold text-white">
              Not Sure What&apos;s Holding Your Website Back?
            </h2>
            <p className="mt-5 max-w-[42ch] text-[1.0625rem] leading-[1.65] text-white/75 sm:text-[1.125rem]">
              Request a free review and get practical notes on visibility,
              structure, speed and conversion — a focused starting point, not a
              full consulting engagement.
            </p>
            <Button asChild size="lg" className="mt-9">
              <Link href="/free-website-review">
                Get a Free Website Review
              </Link>
            </Button>
          </div>

          {/* What the review covers — typographic rows, not boxed cards */}
          <div>
            <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-white/45">
              What we look at
            </p>
            <ul className="mt-5 divide-y divide-white/12 border-y border-white/12">
              {checklist.map((item) => (
                <li
                  key={item.label}
                  className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4"
                >
                  <span className="font-display text-[1.0625rem] font-semibold text-white sm:text-[1.125rem]">
                    {item.label}
                  </span>
                  <span className="text-[0.9375rem] text-white/60">
                    {item.detail}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
