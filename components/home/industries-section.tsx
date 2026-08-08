import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { industries } from "@/data/industries";

export function IndustriesSection() {
  return (
    <Section tone="muted">
      <Container>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeader
            eyebrow="Industries"
            title="Websites for Businesses Across Industries"
            description="From local businesses to e-commerce and professional services — the principles stay the same: clarity, discoverability and conversion."
          />
          <Button asChild variant="outline" className="shrink-0 self-start">
            <Link href="/industries">View industries</Link>
          </Button>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {industries.map((industry) => (
            <div
              key={industry.slug}
              className="flex gap-4 border border-border bg-surface p-5"
            >
              <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent-text">
                <Icon name={industry.icon} />
              </div>
              <div>
                <h3 className="font-display text-base font-semibold">
                  {industry.name}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  {industry.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
