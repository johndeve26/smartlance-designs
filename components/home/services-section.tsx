import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Icon } from "@/components/ui/icon";

export type HomepageServiceItem = {
  slug: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  size: "large" | "medium";
};

/** Primary offering — the two anchors the rest of the work hangs off. */
function PrimaryService({ service }: { service: HomepageServiceItem }) {
  return (
    <Link
      href={service.href}
      className="group flex flex-col justify-between gap-8 border-t-2 border-foreground pt-7 transition-colors hover:border-accent"
    >
      <div>
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-accent-soft text-accent-text">
          <Icon name={service.icon} className="h-5 w-5" />
        </span>
        <h3 className="mt-6 font-display text-[1.75rem] font-semibold leading-tight sm:text-3xl lg:text-[2rem]">
          {service.title}
        </h3>
        <p className="body-copy mt-3.5 max-w-md">{service.description}</p>
      </div>
      <span className="link-action">
        Explore {service.title}
        <ArrowUpRight
          className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none"
          aria-hidden
        />
      </span>
    </Link>
  );
}

/** Supporting capability — deliberately quieter than the primary anchors. */
function SupportingService({ service }: { service: HomepageServiceItem }) {
  return (
    <Link
      href={service.href}
      className="group flex flex-col border-t border-border pt-5 transition-colors hover:border-accent"
    >
      <div className="flex items-center gap-2.5">
        <Icon
          name={service.icon}
          className="h-[1.125rem] w-[1.125rem] text-accent-text"
        />
        <h3 className="font-display text-[1.0625rem] font-semibold sm:text-[1.125rem]">
          {service.title}
        </h3>
      </div>
      <p className="mt-2.5 text-[0.9375rem] leading-[1.65] text-muted">
        {service.description}
      </p>
      <span className="mt-4 inline-flex items-center gap-1 text-[0.9375rem] font-semibold text-accent-text group-hover:underline">
        Explore
        <ArrowUpRight
          className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
          aria-hidden
        />
        <span className="sr-only"> {service.title}</span>
      </span>
    </Link>
  );
}

export function HomeServices({ items }: { items: HomepageServiceItem[] }) {
  if (!items.length) return null;

  const primary = items.filter((item) => item.size === "large");
  const supporting = items.filter((item) => item.size === "medium");

  return (
    <section className="section-padding bg-surface-muted">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,0.45fr)] lg:items-end lg:gap-16">
          <div>
            <p className="eyebrow">What we do</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              Website, SEO and Conversion — Working Together
            </h2>
          </div>
          <div className="lg:pb-1">
            <p className="section-deck max-w-[42ch]">
              Core capabilities — with design and development at the centre.
            </p>
            <p className="mt-4">
              <Link href="/services" className="link-action">
                View All Services →
              </Link>
            </p>
          </div>
        </div>

        {primary.length > 0 ? (
          <div className="mt-14 grid gap-10 md:grid-cols-2 md:gap-12 lg:gap-16">
            {primary.map((service) => (
              <PrimaryService key={service.slug} service={service} />
            ))}
          </div>
        ) : null}

        {supporting.length > 0 ? (
          <div className="mt-14 lg:mt-16">
            <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-muted">
              Working alongside
            </p>
            <div className="mt-6 grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
              {supporting.map((service) => (
                <SupportingService key={service.slug} service={service} />
              ))}
            </div>
          </div>
        ) : null}
      </Container>
    </section>
  );
}
