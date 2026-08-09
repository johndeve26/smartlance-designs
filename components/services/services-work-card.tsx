import Link from "next/link";
import { SiteImage } from "@/components/ui/site-image";
import { ArrowRight } from "lucide-react";
import type { Project } from "@/types";

type ServicesWorkCardProps = {
  project: Project;
};

export function ServicesWorkCard({ project }: ServicesWorkCardProps) {
  const imageSrc = project.heroImage || project.image;
  const servicesLabel = project.services.slice(0, 2).join(" · ");

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface">
      <Link
        href={`/work/${project.slug}`}
        className="relative block aspect-[8/5] overflow-hidden bg-surface-muted"
      >
        {imageSrc ? (
          <SiteImage
            src={imageSrc}
            alt={project.imageAlt || `${project.name} website`}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.02] motion-reduce:transition-none"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="font-display text-xl font-semibold sm:text-[1.375rem]">
          <Link href={`/work/${project.slug}`} className="hover:text-accent-text">
            {project.name}
          </Link>
        </h3>
        <p className="mt-2 text-[0.9375rem] text-muted">
          {project.industry}
          {project.platform ? ` · ${project.platform}` : ""}
        </p>
        {servicesLabel ? (
          <p className="mt-1.5 text-[0.875rem] text-subtle">{servicesLabel}</p>
        ) : null}
        <Link
          href={`/work/${project.slug}`}
          className="group/link mt-auto inline-flex items-center gap-1.5 pt-5 text-[0.9375rem] font-semibold text-accent-text hover:underline"
        >
          View Case Study
          <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-0.5 motion-reduce:transition-none" />
        </Link>
      </div>
    </article>
  );
}
