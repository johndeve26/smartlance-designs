import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { PUBLIC_CTAS } from "@/lib/public/cta-map";

export function HomeFinalCtaSection() {
  return (
    <section className="section-padding bg-surface-dark text-white">
      <Container>
        <div className="max-w-2xl">
          <h2 className="heading-section font-display font-semibold text-white">
            Ready to Move Your Website Forward?
          </h2>
          <p className="mt-5 text-[1.0625rem] leading-[1.65] text-white/75 sm:text-[1.125rem]">
            Tell us about what you&apos;re working on and we&apos;ll help you
            figure out the right next step.
          </p>
          <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Button asChild size="lg">
              <Link href={PUBLIC_CTAS.project.href}>{PUBLIC_CTAS.project.label}</Link>
            </Button>
          </div>
          <p className="mt-8 text-[0.9375rem] text-white/65">
            Not ready yet?{" "}
            <Link
              href={PUBLIC_CTAS.freeReview.href}
              className="font-semibold text-white underline-offset-4 hover:underline"
            >
              {PUBLIC_CTAS.freeReview.label}
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
