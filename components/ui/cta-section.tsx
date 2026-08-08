import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CTASectionProps = {
  title: string;
  description?: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  tone?: "dark" | "accent" | "muted";
  className?: string;
};

export function CTASection({
  title,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  tone = "dark",
  className,
}: CTASectionProps) {
  const sectionTone = tone === "muted" ? "muted" : tone === "accent" ? "default" : "dark";

  return (
    <Section
      tone={sectionTone}
      className={cn(
        tone === "accent" && "bg-accent-soft",
        className,
      )}
    >
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h2
              className={cn(
                "text-3xl sm:text-4xl leading-tight",
                tone === "dark" ? "text-white" : "text-foreground",
              )}
            >
              {title}
            </h2>
            {description ? (
              <p
                className={cn(
                  "mt-4 text-base sm:text-lg leading-relaxed",
                  tone === "dark" ? "text-white/75" : "text-muted",
                )}
              >
                {description}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" variant={tone === "dark" ? "primary" : "secondary"}>
              <Link href={primaryHref}>{primaryLabel}</Link>
            </Button>
            {secondaryLabel && secondaryHref ? (
              <Button
                asChild
                size="lg"
                variant={tone === "dark" ? "outline" : "outline"}
                className={cn(
                  tone === "dark" &&
                    "border-white/25 bg-transparent text-white hover:border-white hover:bg-white/5 hover:text-white",
                )}
              >
                <Link href={secondaryHref}>{secondaryLabel}</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </Container>
    </Section>
  );
}
