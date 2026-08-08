import Link from "next/link";
import { Container } from "@/components/ui/container";

export type ProblemPoint = {
  title: string;
  description: string;
};

export function ProblemSection({ points }: { points: ProblemPoint[] }) {
  if (!points.length) return null;

  return (
    <section className="section-padding bg-surface">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] lg:gap-16 xl:gap-20">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <p className="eyebrow">The business problem</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              Your Website Should Do More Than Look Good.
            </h2>
            <p className="section-deck mt-5 max-w-[36ch]">
              A polished design does not help if people cannot find you,
              understand you, or take action when they arrive.
            </p>
            <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6">
              <Link href="/solutions" className="link-action">
                Explore Website Solutions →
              </Link>
              <Link href="/project-planner" className="link-action">
                Plan Your Project →
              </Link>
            </div>
          </div>

          <ol className="grid sm:grid-cols-2">
            {points.map((point, index) => (
              <li
                key={point.title}
                className="border-t border-border py-7 sm:odd:pr-8 sm:even:pl-8 sm:[&:nth-child(-n+2)]:border-t-0 sm:[&:nth-child(-n+2)]:pt-0 lg:odd:border-r"
              >
                <span className="ordinal-marker">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2.5 font-display text-xl font-semibold sm:text-[1.375rem]">
                  {point.title}
                </h3>
                <p className="body-copy mt-2.5">{point.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
