import Link from "next/link";
import { Container } from "@/components/ui/container";
import type { ProcessStep } from "@/types";
import { PUBLIC_CTAS } from "@/lib/public/cta-map";

export function ProcessSection({ steps }: { steps: ProcessStep[] }) {
  if (!steps.length) return null;

  return (
    <section className="section-padding bg-surface">
      <Container>
        <div className="max-w-2xl">
          <p className="eyebrow">Process</p>
          <h2 className="heading-section mt-3 font-display font-semibold">
            How Smartlance Works
          </h2>
          <p className="section-deck mt-4">
            A structured path from understanding your business to launch — and
            improvement beyond it.
          </p>
        </div>

        {/* Desktop: 3×2 editorial grid — ordinals stay secondary to titles */}
        <ol className="mt-12 hidden gap-x-10 gap-y-11 md:grid md:grid-cols-3 lg:gap-x-14">
          {steps.map((step) => (
            <li key={step.title} className="border-t border-border pt-6">
              <span className="ordinal-marker">
                {String(step.step).padStart(2, "0")}
              </span>
              <h3 className="mt-3 font-display text-xl font-semibold sm:text-[1.375rem]">
                {step.title}
              </h3>
              <p className="body-copy mt-2.5">{step.description}</p>
            </li>
          ))}
        </ol>

        {/* Mobile: clear vertical sequence */}
        <ol className="relative mt-10 border-l border-border pl-7 md:hidden">
          {steps.map((step) => (
            <li key={step.title} className="relative pb-8 last:pb-0">
              <span
                className="absolute -left-[calc(1.75rem+0.3125rem)] top-[0.4375rem] h-2.5 w-2.5 rounded-full border border-accent bg-surface"
                aria-hidden
              />
              <p className="flex items-baseline gap-2.5">
                <span className="ordinal-marker">
                  {String(step.step).padStart(2, "0")}
                </span>
                <span className="font-display text-lg font-semibold text-foreground">
                  {step.title}
                </span>
              </p>
              <p className="body-copy mt-2">{step.description}</p>
            </li>
          ))}
        </ol>

        <p className="mt-10">
          <Link href={PUBLIC_CTAS.howWeWork.href} className="link-action">
            {PUBLIC_CTAS.howWeWork.label} →
          </Link>
        </p>
      </Container>
    </section>
  );
}
