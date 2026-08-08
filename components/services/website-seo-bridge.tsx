import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";

const connectionPoints = [
  {
    title: "Design",
    description: "Usability and trust shape whether visitors stay.",
  },
  {
    title: "Structure",
    description: "Page hierarchy affects crawlability and clarity.",
  },
  {
    title: "Content",
    description: "Relevance and intent determine search value.",
  },
  {
    title: "Performance",
    description: "Speed affects experience and technical SEO.",
  },
  {
    title: "Conversion",
    description: "Traffic only matters if it becomes business.",
  },
];

export function WebsiteSeoBridge() {
  return (
    <section className="border-y border-border bg-surface-muted py-12 sm:py-14 lg:py-16">
      <Container>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-16">
          <div className="max-w-xl">
            <p className="eyebrow">Integrated approach</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              Your Website and SEO Should Be Built Together
            </h2>
            <p className="mt-4 max-w-[36rem] text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              Smartlance treats design, development, SEO and conversion as one
              connected system — not separate projects handed off in sequence.
            </p>
            <Link
              href="/seo"
              className="group mt-6 inline-flex items-center gap-1.5 text-[0.9375rem] font-semibold text-accent-text hover:underline"
            >
              Explore Our SEO Approach
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
            </Link>
          </div>

          <ol className="border-t border-border">
            {connectionPoints.map((point, index) => (
              <li
                key={point.title}
                className="flex gap-4 border-b border-border py-5"
              >
                <span className="font-display text-xl font-semibold tabular-nums text-accent-text sm:text-2xl">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="font-display text-lg font-semibold sm:text-xl">
                    {point.title}
                  </p>
                  <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                    {point.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
