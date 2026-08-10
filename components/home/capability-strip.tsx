import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { homepageCapabilityPillars } from "@/lib/public/ai-automation-content";

export function HomeCapabilityStrip() {
  return (
    <Section className="border-b border-border !py-6 sm:!py-8">
      <Container>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {homepageCapabilityPillars.map((pillar) => (
            <Link
              key={pillar.label}
              href={pillar.href}
              className="group rounded-lg border border-border bg-surface px-4 py-4 transition-colors hover:border-border-strong hover:bg-surface-muted sm:px-5 sm:py-5"
            >
              <p className="font-display text-lg font-semibold text-foreground group-hover:text-accent-text">
                {pillar.label}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted sm:text-sm">
                {pillar.description}
              </p>
            </Link>
          ))}
        </div>
      </Container>
    </Section>
  );
}
