import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { Project } from "@/types";
import { cn } from "@/lib/utils";

type ServiceProofCardProps = {
  project: Project;
  className?: string;
  imageClassName?: string;
};

export function ServiceProofCard({
  project,
  className,
  imageClassName,
}: ServiceProofCardProps) {
  const imageSrc = project.heroImage || project.image;
  const servicesLabel = project.services.slice(0, 2).join(" · ");

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface",
        className,
      )}
    >
      <Link
        href={`/work/${project.slug}`}
        className={cn(
          "relative block aspect-[8/5] overflow-hidden bg-surface-muted sm:aspect-[16/10]",
          imageClassName,
        )}
      >
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={project.imageAlt || `${project.name} website`}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.02] motion-reduce:transition-none"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col p-5 sm:p-6 lg:p-7">
        <h3 className="font-display text-xl font-semibold sm:text-2xl">
          <Link href={`/work/${project.slug}`} className="hover:text-accent-text">
            {project.name}
          </Link>
        </h3>
        <p className="mt-2 text-base text-muted">
          {project.industry}
          {project.platform ? ` · ${project.platform}` : ""}
        </p>
        {servicesLabel ? (
          <p className="mt-1.5 text-[0.9375rem] text-subtle">{servicesLabel}</p>
        ) : null}
        <Link
          href={`/work/${project.slug}`}
          className="group/link mt-auto inline-flex items-center gap-1.5 pt-5 text-base font-semibold text-accent-text hover:underline"
        >
          View Case Study
          <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-0.5 motion-reduce:transition-none" />
        </Link>
      </div>
    </article>
  );
}
