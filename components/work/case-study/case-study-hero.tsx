import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { CaseStudyImage } from "@/components/work/case-study/case-study-image";
import type { Project } from "@/types";
import { cn } from "@/lib/utils";

type CaseStudyHeroProps = {
  project: Project;
  statement: string;
  image?: { src: string; alt: string };
  /** Distinct secondary asset only — never a duplicate of the hero */
  supportingImage?: { src: string; alt: string };
  externalLinkLabel?: string;
  eyebrow?: string;
  supportingCopy?: string;
};

export function CaseStudyHero({
  project,
  statement,
  image,
  supportingImage,
  externalLinkLabel = "Visit Website",
  eyebrow,
  supportingCopy,
}: CaseStudyHeroProps) {
  return (
    <section className="border-b border-border bg-surface-muted">
      <Container className="!pt-10 !pb-12 sm:!pb-14 lg:!pb-16 xl:!pb-[4.5rem]">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Work", href: "/work" },
            { label: project.name },
          ]}
        />

        <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,0.52fr)_minmax(0,0.48fr)] lg:gap-8 xl:gap-10">
          <div className="min-w-0 lg:pt-2">
            <p className="eyebrow">
              {eyebrow ||
                `Project${project.industry ? ` · ${project.industry}` : ""}`}
            </p>
            <h1 className="mt-4 font-display text-[clamp(2.5rem,4.8vw,4.75rem)] font-semibold leading-[1.05] tracking-tight text-foreground">
              {project.name}
            </h1>
            {statement ? (
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
                {statement}
              </p>
            ) : null}
            {supportingCopy ? (
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
                {supportingCopy}
              </p>
            ) : null}

            <dl className="mt-8 grid gap-x-6 gap-y-5 border-t border-border pt-6 sm:grid-cols-2">
              {project.client ? (
                <MetaItem label="Client" value={project.client} />
              ) : null}
              {project.platform ? (
                <MetaItem
                  label="Platform"
                  value={project.platform.replace(/ \+ /g, " · ")}
                />
              ) : null}
              {project.industry ? (
                <MetaItem label="Industry" value={project.industry} />
              ) : null}
              {project.year ? (
                <MetaItem label="Year" value={String(project.year)} />
              ) : null}
              {project.services.length > 0 ? (
                <div className="sm:col-span-2">
                  <dt className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-subtle">
                    Services
                  </dt>
                  <dd className="mt-2 text-[1.0625rem] leading-snug text-foreground sm:text-lg">
                    {project.services.join(" · ")}
                  </dd>
                </div>
              ) : null}
            </dl>

            {project.websiteUrl ? (
              <div className="mt-8 max-w-md">
                <Button asChild size="lg">
                  <a
                    href={project.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {externalLinkLabel}
                    <ArrowUpRight className="ml-1.5 h-4 w-4" />
                  </a>
                </Button>
                <p className="mt-3 max-w-sm text-xs leading-relaxed text-subtle sm:text-[0.8125rem]">
                  The live website may have changed since this case study was
                  published and may differ from the work shown here.
                </p>
              </div>
            ) : null}
          </div>

          <div className="relative min-w-0 w-full lg:pt-1">
            <BrowserFrame className="shadow-lg ring-1 ring-black/5">
              {image ? (
                <div className="relative aspect-[16/10] overflow-hidden bg-surface-muted sm:aspect-[16/9]">
                  <CaseStudyImage
                    src={image.src}
                    alt={image.alt}
                    fill
                    priority
                    className="object-cover object-top"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              ) : (
                <div className="flex aspect-[16/10] items-center justify-center bg-surface-muted text-base text-muted">
                  Project visual coming soon
                </div>
              )}
            </BrowserFrame>

            {supportingImage ? (
              <div className="absolute -bottom-6 -left-4 hidden w-[38%] max-w-[11.5rem] sm:block lg:-left-8 xl:max-w-[13rem]">
                <PhoneFrame>
                  <div className="relative aspect-[9/16] overflow-hidden bg-surface-muted">
                    <CaseStudyImage
                      src={supportingImage.src}
                      alt={supportingImage.alt}
                      fill
                      loading="eager"
                      className="object-cover object-top"
                      sizes="180px"
                    />
                  </div>
                </PhoneFrame>
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-subtle">
        {label}
      </dt>
      <dd className="mt-2 text-[1.0625rem] leading-snug text-foreground sm:text-lg">
        {value}
      </dd>
    </div>
  );
}

export function BrowserFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border/80 bg-surface shadow-md",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 border-b border-border bg-surface px-3.5 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
        <span className="ml-2.5 h-4 flex-1 rounded-md bg-surface-muted" />
      </div>
      {children}
    </div>
  );
}

function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[1.25rem] border-[3px] border-foreground/90 bg-foreground shadow-xl">
      <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-white/25" />
      <div className="m-1.5 overflow-hidden rounded-[0.9rem] bg-surface">
        {children}
      </div>
    </div>
  );
}
