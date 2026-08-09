import Link from "next/link";
import { PortfolioScreenshot } from "@/components/ui/site-image";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import type { Project } from "@/types";

function ProjectMeta({ project }: { project: Project }) {
  return (
    <p className="text-meta mt-2.5">
      {project.industry}
      {project.services[0] ? (
        <>
          <span aria-hidden> · </span>
          {project.services[0]}
        </>
      ) : null}
    </p>
  );
}

function FeaturedProjectHero({ project }: { project: Project }) {
  const imageSrc = project.heroImage || project.image;
  return (
    <article className="group overflow-hidden border border-border bg-surface">
      <Link
        href={`/work/${project.slug}`}
        tabIndex={-1}
        className="block bg-surface-muted"
      >
        {imageSrc ? (
          <PortfolioScreenshot
            src={imageSrc}
            alt={project.imageAlt || `${project.name} website`}
            loading="lazy"
            sizes="(max-width: 1280px) 100vw, 1280px"
          />
        ) : null}
      </Link>
      <div className="grid gap-6 border-t border-border p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-12 lg:p-10">
        <div>
          <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-accent-text">
            Featured project
          </p>
          <h3 className="mt-3 font-display text-[1.75rem] font-semibold leading-tight sm:text-4xl lg:text-[2.75rem]">
            <Link
              href={`/work/${project.slug}`}
              className="transition-colors hover:text-accent-text"
            >
              {project.name}
            </Link>
          </h3>
          <ProjectMeta project={project} />
          <p className="body-copy mt-4 max-w-2xl">
            {project.shortDescription || project.objective || project.challenge}
          </p>
        </div>
        <Link
          href={`/work/${project.slug}`}
          className="link-action group/link lg:pb-1"
        >
          View Project
          <ArrowRight
            className="h-4 w-4 transition-transform group-hover/link:translate-x-0.5 motion-reduce:transition-none"
            aria-hidden
          />
          <span className="sr-only">: {project.name}</span>
        </Link>
      </div>
    </article>
  );
}

function SupportingProjectCard({ project }: { project: Project }) {
  const imageSrc = project.image || project.heroImage;
  return (
    <article className="group flex h-full flex-col overflow-hidden border border-border bg-surface">
      <Link
        href={`/work/${project.slug}`}
        tabIndex={-1}
        className="block bg-surface-muted"
      >
        {imageSrc ? (
          <PortfolioScreenshot
            src={imageSrc}
            alt={project.imageAlt || `${project.name} website`}
            loading="lazy"
            maxWidthClassName="max-w-full"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 600px"
          />
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col border-t border-border p-6 sm:p-7">
        <h3 className="font-display text-xl font-semibold sm:text-[1.5rem]">
          <Link
            href={`/work/${project.slug}`}
            className="transition-colors hover:text-accent-text"
          >
            {project.name}
          </Link>
        </h3>
        <ProjectMeta project={project} />
        <Link
          href={`/work/${project.slug}`}
          className="link-action group/link mt-auto pt-6"
        >
          View Project
          <ArrowRight
            className="h-4 w-4 transition-transform group-hover/link:translate-x-0.5 motion-reduce:transition-none"
            aria-hidden
          />
          <span className="sr-only">: {project.name}</span>
        </Link>
      </div>
    </article>
  );
}

export function HomePortfolio({
  selectedProjects,
}: {
  selectedProjects: Project[];
}) {
  const projects = selectedProjects;
  if (projects.length === 0) return null;

  const [featured, ...rest] = projects;

  return (
    <section className="section-padding-feature bg-surface-muted">
      <Container>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="eyebrow">Work</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              Selected Work
            </h2>
            <p className="section-deck mt-4">
              Real website projects for hospitality, property and service
              businesses.
            </p>
          </div>
          <Button asChild variant="outline" className="shrink-0 self-start sm:self-end">
            <Link href="/work">View All Work</Link>
          </Button>
        </div>

        <div className="mt-12 space-y-6">
          <FeaturedProjectHero project={featured} />
          {rest.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2">
              {rest.map((project) => (
                <SupportingProjectCard key={project.slug} project={project} />
              ))}
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
