"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ProjectCard } from "@/components/ui/project-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Project } from "@/types";

type FilterState = {
  industry: string;
  platform: string;
  expertise: string;
};

const ALL = "All";

function sortProjects(projects: Project[]) {
  return [...projects].sort((a, b) => {
    const orderA = a.displayOrder ?? (a.featured ? 50 : 100);
    const orderB = b.displayOrder ?? (b.featured ? 50 : 100);
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name);
  });
}

export function PortfolioFilters({
  projects: inputProjects,
  initialPlatform,
}: {
  projects: Project[];
  initialPlatform?: string;
}) {
  const projects = useMemo(() => sortProjects(inputProjects), [inputProjects]);
  const [filters, setFilters] = useState<FilterState>({
    industry: ALL,
    platform: initialPlatform || ALL,
    expertise: ALL,
  });

  const industries = useMemo(
    () =>
      [
        ALL,
        ...Array.from(
          new Set(projects.map((p) => p.industry).filter(Boolean)),
        ).sort(),
      ],
    [projects],
  );

  const platforms = useMemo(
    () =>
      [
        ALL,
        ...Array.from(
          new Set(
            projects
              .flatMap((p) => [p.platform, ...(p.platforms ?? [])])
              .filter((value): value is string => Boolean(value && value.trim())),
          ),
        ).sort(),
      ],
    [projects],
  );

  const expertiseOptions = useMemo(
    () =>
      [ALL, ...Array.from(new Set(projects.flatMap((p) => p.services))).sort()],
    [projects],
  );

  const filtered = useMemo(() => {
    return projects.filter((project) => {
      if (filters.industry !== ALL && project.industry !== filters.industry) {
        return false;
      }
      if (filters.platform !== ALL) {
        const projectPlatforms = [
          project.platform,
          ...(project.platforms ?? []),
        ].filter(Boolean);
        if (!projectPlatforms.includes(filters.platform)) return false;
      }
      if (
        filters.expertise !== ALL &&
        !project.services.includes(
          filters.expertise as (typeof project.services)[number],
        )
      ) {
        return false;
      }
      return true;
    });
  }, [filters, projects]);

  const hasActiveFilters =
    filters.industry !== ALL ||
    filters.platform !== ALL ||
    filters.expertise !== ALL;

  const resetFilters = () =>
    setFilters({ industry: ALL, platform: ALL, expertise: ALL });

  if (projects.length === 0) {
    return (
      <div className="border border-border bg-surface px-6 py-12 text-center sm:px-10">
        <h2 className="font-display text-2xl font-semibold">
          Case studies are being prepared
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-muted">
          Published project write-ups will appear here once client work and
          screenshots are approved. In the meantime, tell us about your website
          goals.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/free-website-review">Get a Free Website Review</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/contact">Tell Us About Your Project</Link>
          </Button>
        </div>
      </div>
    );
  }

  const count = filtered.length;
  const useFeaturedHierarchy = count >= 5;
  const useTwoColumn = count >= 2 && count <= 4;
  const useSingle = count === 1;

  const lead = useFeaturedHierarchy ? filtered[0] : null;
  const support = useFeaturedHierarchy ? filtered[1] : null;
  const remaining = useFeaturedHierarchy ? filtered.slice(2) : filtered;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-[0.9375rem] font-medium text-muted">
          Filter by industry, platform or capability.
        </p>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={resetFilters}
            className="self-start text-[0.9375rem] font-semibold text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Reset filters
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3 sm:gap-4">
        <FilterSelect
          id="filter-industry"
          label="Industry"
          value={filters.industry}
          options={industries}
          active={filters.industry !== ALL}
          onChange={(industry) => setFilters((prev) => ({ ...prev, industry }))}
        />
        <FilterSelect
          id="filter-platform"
          label="Platform"
          value={filters.platform}
          options={platforms}
          active={filters.platform !== ALL}
          onChange={(platform) => setFilters((prev) => ({ ...prev, platform }))}
        />
        <FilterSelect
          id="filter-expertise"
          label="Expertise"
          value={filters.expertise}
          options={expertiseOptions}
          active={filters.expertise !== ALL}
          onChange={(expertise) =>
            setFilters((prev) => ({ ...prev, expertise }))
          }
        />
      </div>

      <div className="mt-7 flex items-baseline justify-between gap-4 border-b border-border pb-4">
        <p className="text-base font-medium text-foreground">
          Showing{" "}
          <span className="tabular-nums text-accent-text">{count}</span> of{" "}
          <span className="tabular-nums">{projects.length}</span> projects
        </p>
        {hasActiveFilters ? (
          <p className="text-[0.9375rem] text-muted">Filtered view</p>
        ) : null}
      </div>

      {count === 0 ? (
        <div className="mt-10 border border-border bg-surface-muted/50 px-6 py-12 text-center sm:px-10">
          <h2 className="font-display text-2xl font-semibold">
            No projects match those filters.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-muted">
            Try a broader combination, or tell us what kind of example would
            help.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row sm:items-center">
            <Button type="button" onClick={resetFilters}>
              Reset filters
            </Button>
            <Link
              href="/contact"
              className="text-base font-semibold text-accent-text hover:underline"
            >
              Tell us what you&apos;re looking for →
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-10 space-y-12 sm:space-y-14 lg:space-y-16">
          {useFeaturedHierarchy && lead && support ? (
            <>
              <div className="grid gap-10 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-0">
                <div className="lg:col-span-8">
                  <ProjectCard project={lead} variant="lead" />
                </div>
                <div className="lg:col-span-4 lg:pt-1">
                  <ProjectCard project={support} variant="featured" />
                </div>
              </div>
              {remaining.length > 0 ? (
                <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 sm:gap-y-14">
                  {remaining.map((project) => (
                    <ProjectCard key={project.slug} project={project} />
                  ))}
                </div>
              ) : null}
            </>
          ) : null}

          {useTwoColumn ? (
            <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 sm:gap-y-14">
              {remaining.map((project) => (
                <ProjectCard key={project.slug} project={project} />
              ))}
            </div>
          ) : null}

          {useSingle ? (
            <div className="max-w-4xl">
              <ProjectCard project={remaining[0]} variant="lead" />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  id,
  label,
  value,
  options,
  active,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  active: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-subtle"
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            "h-12 w-full appearance-none rounded-lg border bg-surface px-4 pr-11 text-base font-medium text-foreground outline-none transition-[border-color,box-shadow,background-color] duration-200",
            "hover:border-foreground/25 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/25",
            active ? "border-accent/55 bg-orange-50/50" : "border-border",
          )}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23F47A48' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 0.95rem center",
          }}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option === ALL ? `All ${label}` : option}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
