import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { Project } from "@/types";
import { cn } from "@/lib/utils";

type ProjectCardProps = {
  project: Project;
  className?: string;
  /**
   * lead — primary featured placement (summary + larger type)
   * featured — elevated supporting placement
   * default — standard portfolio card
   */
  variant?: "default" | "featured" | "lead";
};

export function ProjectCard({
  project,
  className,
  variant = "default",
}: ProjectCardProps) {
  const isLead = variant === "lead";
  const isFeatured = variant === "featured" || isLead;
  const imageSrc = isLead
    ? project.heroImage || project.image
    : project.image || project.heroImage;
  const industryPlatform = [project.industry, project.platform]
    .filter(Boolean)
    .join(" · ");
  const servicesLabel = project.services.slice(0, isLead ? 3 : 2).join(" · ");
  const summary =
    isLead && (project.shortDescription || project.objective)
      ? (project.shortDescription || project.objective)
      : null;

  return (
    <article className={cn("group flex h-full flex-col", className)}>
      <Link
        href={`/work/${project.slug}`}
        aria-label={`View case study: ${project.name}`}
        className={cn(
          "relative block overflow-hidden bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          isLead
            ? "aspect-[16/10] sm:aspect-[3/2] lg:aspect-[16/10]"
            : "aspect-[16/10]",
        )}
      >
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={project.imageAlt ?? `${project.name} website`}
            fill
            className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.02] motion-reduce:transition-none"
            sizes={
              isLead
                ? "(max-width: 1024px) 100vw, 66vw"
                : isFeatured
                  ? "(max-width: 1024px) 100vw, 34vw"
                  : "(max-width: 768px) 100vw, 50vw"
            }
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-200 to-neutral-300" />
        )}
        <span
          className="pointer-events-none absolute inset-0 bg-foreground/0 transition-colors duration-500 group-hover:bg-foreground/[0.04] motion-reduce:transition-none"
          aria-hidden
        />
      </Link>

      <div className={cn("flex flex-1 flex-col", isLead ? "pt-6 sm:pt-7" : "pt-5")}>
        {industryPlatform ? (
          <p
            className={cn(
              "font-semibold uppercase tracking-[0.12em] text-subtle",
              isLead ? "text-xs" : "text-[0.6875rem] sm:text-xs",
            )}
          >
            {industryPlatform}
          </p>
        ) : null}

        <h3
          className={cn(
            "font-display font-semibold leading-snug text-foreground",
            industryPlatform ? "mt-2.5" : "mt-0",
            isLead
              ? "text-[1.625rem] sm:text-3xl lg:text-[2rem]"
              : "text-xl sm:text-[1.375rem]",
          )}
        >
          <Link
            href={`/work/${project.slug}`}
            className="transition-colors hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {project.name}
          </Link>
        </h3>

        {summary ? (
          <p className="mt-3 max-w-xl text-base leading-relaxed text-muted line-clamp-2 sm:text-[1.0625rem]">
            {summary}
          </p>
        ) : null}

        {servicesLabel ? (
          <p
            className={cn(
              "text-muted",
              summary ? "mt-3" : "mt-2",
              "text-[0.9375rem] sm:text-base",
            )}
          >
            {servicesLabel}
          </p>
        ) : null}

        <Link
          href={`/work/${project.slug}`}
          className="group/link mt-auto inline-flex items-center gap-1.5 pt-5 text-base font-semibold text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          View Case Study
          <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-[3px] motion-reduce:transition-none" />
        </Link>
      </div>
    </article>
  );
}
