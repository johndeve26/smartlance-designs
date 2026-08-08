import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ServiceFeatureVisual } from "@/components/services/service-feature-visual";
import { cn } from "@/lib/utils";

type ServiceFeatureRowProps = {
  id?: string;
  number: string;
  title: string;
  description: string;
  href: string;
  ctaLabel?: string;
  reverse?: boolean;
  variant: "design" | "development" | "seo" | "redesign";
  projectImage?: string;
  projectImageAlt?: string;
};

export function ServiceFeatureRow({
  id,
  number,
  title,
  description,
  href,
  ctaLabel = "Explore this capability",
  reverse = false,
  variant,
  projectImage,
  projectImageAlt,
}: ServiceFeatureRowProps) {
  return (
    <article
      id={id}
      className="scroll-mt-28 border-t border-border py-8 first:border-t-0 first:pt-0 sm:py-10 lg:py-12"
    >
      <div className="grid items-center gap-7 lg:grid-cols-2 lg:gap-12 xl:gap-14">
        {/* Consistent mobile order: content → visual */}
        <div className={cn("order-1 min-w-0", reverse && "lg:order-2")}>
          <p className="font-display text-base font-semibold tabular-nums tracking-tight text-accent-text">
            {number}
          </p>
          <h2 className="mt-2.5 font-display text-3xl font-semibold sm:text-[2.125rem] lg:text-4xl">
            {title}
          </h2>
          <p className="mt-3.5 max-w-[36rem] text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
            {description}
          </p>
          <Link
            href={href}
            className="group mt-5 inline-flex items-center gap-1.5 text-[0.9375rem] font-semibold text-accent-text hover:underline"
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
          </Link>
        </div>

        <div className={cn("order-2", reverse && "lg:order-1")}>
          <ServiceFeatureVisual
            variant={variant}
            title={title}
            projectImage={projectImage}
            projectImageAlt={projectImageAlt}
          />
        </div>
      </div>
    </article>
  );
}
