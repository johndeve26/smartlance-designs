"use client";

import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { preFooterCta, primaryCta as defaultPrimaryCta } from "@/data/navigation";
import { trackEvent } from "@/lib/analytics";

type PreFooterCtaProps = {
  primaryCta?: { label: string; href: string };
};

export function PreFooterCta({
  primaryCta = defaultPrimaryCta,
}: PreFooterCtaProps) {
  return (
    <section
      aria-labelledby="pre-footer-heading"
      className="border-t border-border bg-surface-muted print:hidden"
    >
      <Container className="py-16 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="pre-footer-heading"
            className="font-display text-[1.75rem] font-semibold leading-tight tracking-tight text-foreground sm:text-4xl"
          >
            {preFooterCta.title}
          </h2>
          <p className="mx-auto mt-5 max-w-[46ch] text-[1.0625rem] leading-[1.65] text-muted sm:text-[1.125rem]">
            {preFooterCta.description}
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="rounded-[0.5rem]">
              <Link
                href={primaryCta.href}
                onClick={() =>
                  trackEvent("get_quote_clicked", { location: "pre-footer" })
                }
              >
                {primaryCta.label}
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-[0.5rem]">
              <Link href={preFooterCta.secondary.href}>
                {preFooterCta.secondary.label}
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
