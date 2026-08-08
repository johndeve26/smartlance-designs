import Link from "next/link";
import { Container } from "@/components/ui/container";
import type { Testimonial } from "@/types";

function truncateQuote(quote: string, maxLength = 220) {
  if (quote.length <= maxLength) return { text: quote, truncated: false };
  const cut = quote.slice(0, maxLength).replace(/\s+\S*$/, "");
  return { text: `${cut}…`, truncated: true };
}

function Attribution({
  testimonial,
  size = "default",
}: {
  testimonial: Testimonial;
  size?: "default" | "lead";
}) {
  return (
    <figcaption className="mt-6 border-t border-border pt-5">
      <p
        className={
          size === "lead"
            ? "text-[1.0625rem] font-semibold text-foreground"
            : "text-base font-semibold text-foreground"
        }
      >
        {testimonial.name}
      </p>
      <p className="text-meta mt-1">
        {testimonial.company}
        {testimonial.service ? (
          <>
            <span aria-hidden> · </span>
            {testimonial.service}
          </>
        ) : null}
      </p>
    </figcaption>
  );
}

export function TestimonialsSection({ items }: { items: Testimonial[] }) {
  if (items.length === 0) return null;

  const [featured, ...supporting] = items;

  return (
    <section className="section-padding bg-surface">
      <Container>
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12 xl:gap-16">
          <div className="lg:col-span-4 lg:pt-2">
            <p className="eyebrow">Client feedback</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              What Clients Say
            </h2>
            <p className="section-deck mt-5 max-w-[32ch]">
              Real feedback from hospitality, property and service businesses we
              have worked with.
            </p>
            <p className="mt-6">
              <Link href="/work" className="link-action">
                View Client Work →
              </Link>
            </p>
          </div>

          {featured ? (
            <figure className="lg:col-span-8">
              <blockquote className="max-w-[42ch] font-display text-[1.5rem] font-medium leading-[1.4] tracking-tight text-foreground sm:text-[1.875rem] sm:leading-[1.35] lg:max-w-[26ch] lg:text-[2.125rem]">
                <span aria-hidden>“</span>
                {featured.quote}
                <span aria-hidden>”</span>
              </blockquote>
              <Attribution testimonial={featured} size="lead" />
            </figure>
          ) : null}
        </div>

        {supporting.length > 0 ? (
          <div className="mt-14 grid gap-10 border-t border-border pt-12 sm:grid-cols-2 lg:gap-16">
            {supporting.map((testimonial) => {
              const { text, truncated } = truncateQuote(testimonial.quote, 200);
              return (
                <figure key={testimonial.id}>
                  <blockquote className="text-[1.0625rem] leading-[1.6] text-foreground sm:text-[1.1875rem]">
                    <span aria-hidden>“</span>
                    {text}
                    <span aria-hidden>”</span>
                  </blockquote>
                  {truncated && testimonial.projectSlug ? (
                    <p className="mt-3">
                      <Link
                        href={`/work/${testimonial.projectSlug}`}
                        className="link-action"
                      >
                        Read full review →
                      </Link>
                    </p>
                  ) : null}
                  <Attribution testimonial={testimonial} />
                </figure>
              );
            })}
          </div>
        ) : null}
      </Container>
    </section>
  );
}
