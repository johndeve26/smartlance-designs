import Link from "next/link";
import { Container } from "@/components/ui/container";

export type WhySmartlanceItem = {
  title: string;
  description: string;
  icon?: string;
};

export function WhySmartlance({ items }: { items: WhySmartlanceItem[] }) {
  if (!items.length) return null;

  return (
    <section className="section-padding bg-surface-muted">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <p className="eyebrow">Why Smartlance</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              Built Around How Your Business Actually Works
            </h2>
            <p className="section-deck mt-5 max-w-[36ch]">
              Mature website projects need clarity, communication and room to
              grow — not a one-off template delivery.
            </p>
            <p className="mt-6">
              <Link href="/about" className="link-action">
                About Smartlance →
              </Link>
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:col-span-7">
            {items.map((item, index) => (
              <article
                key={item.title}
                className="border-t border-border py-7 sm:odd:pr-8 sm:even:pl-8 sm:[&:nth-child(-n+2)]:border-t-0 sm:[&:nth-child(-n+2)]:pt-0 lg:odd:border-r"
              >
                <span className="ordinal-marker">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-display text-xl font-semibold sm:text-[1.375rem]">
                  {item.title}
                </h3>
                <p className="body-copy mt-2.5">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
