import { SiteImage } from "@/components/ui/site-image";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ServiceFeatureVisualProps = {
  variant: "design" | "development" | "seo" | "redesign";
  title: string;
  projectImage?: string;
  projectImageAlt?: string;
};

/** Shared frame so all four featured visuals share one design system */
function VisualFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-[5/4] overflow-hidden rounded-xl border border-border bg-surface shadow-sm sm:aspect-[4/3]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function BrowserChrome({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-surface shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 border-b border-border bg-surface px-2.5 py-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
        <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
        <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
        <span className="ml-1.5 h-3 flex-1 rounded bg-surface-muted" />
      </div>
      {children}
    </div>
  );
}

export function ServiceFeatureVisual({
  variant,
  title,
  projectImage,
  projectImageAlt,
}: ServiceFeatureVisualProps) {
  if (variant === "design") {
    return (
      <VisualFrame className="bg-surface-muted p-4 sm:p-5">
        <div className="relative flex h-full items-end gap-3">
          {/* Supporting wireframe / structure */}
          <div className="hidden w-[32%] flex-col gap-2 self-stretch rounded-lg border border-dashed border-border bg-surface/80 p-3 sm:flex">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-accent-text">
              Structure
            </p>
            <div className="mt-1 space-y-2">
              <div className="h-1.5 w-3/4 rounded bg-neutral-300" />
              <div className="h-12 rounded border border-border bg-surface" />
              <div className="grid grid-cols-2 gap-1.5">
                <div className="h-8 rounded bg-neutral-200" />
                <div className="h-8 rounded bg-neutral-200" />
              </div>
              <div className="h-1.5 w-1/2 rounded bg-accent/40" />
            </div>
          </div>

          {/* Dominant browser preview */}
          <div className="relative min-h-0 flex-1 self-stretch">
            <BrowserChrome className="absolute inset-0 flex flex-col">
              <div className="relative min-h-0 flex-1 bg-surface-muted">
                {projectImage ? (
                  <SiteImage
                    src={projectImage}
                    alt={projectImageAlt || title}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 768px) 100vw, 480px"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-surface-muted p-4">
                    <div className="h-3 w-1/2 rounded bg-accent/30" />
                    <div className="mt-4 h-24 rounded-lg border border-border bg-surface" />
                  </div>
                )}
              </div>
            </BrowserChrome>
            {/* Mobile peek */}
            <div className="absolute -bottom-1 -right-1 w-[28%] overflow-hidden rounded-lg border border-border bg-surface p-1 shadow-md sm:bottom-2 sm:right-2">
              <div className="relative aspect-[9/16] overflow-hidden rounded-md bg-surface-muted">
                {projectImage ? (
                  <SiteImage
                    src={projectImage}
                    alt=""
                    fill
                    className="object-cover object-top"
                    sizes="120px"
                  />
                ) : (
                  <div className="absolute inset-0 bg-accent-soft" />
                )}
              </div>
            </div>
          </div>
        </div>
      </VisualFrame>
    );
  }

  if (variant === "development") {
    return (
      <VisualFrame className="bg-surface-muted p-4 sm:p-5">
        <div className="relative h-full">
          <BrowserChrome className="absolute inset-0 right-[18%] flex flex-col sm:right-[22%]">
            <div className="relative min-h-0 flex-1 bg-surface-muted">
              {projectImage ? (
                <SiteImage
                  src={projectImage}
                  alt={projectImageAlt || title}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 480px"
                />
              ) : (
                <div className="absolute inset-0 p-5">
                  <div className="h-3 w-1/3 rounded bg-neutral-300" />
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <div className="h-20 rounded-lg border border-border bg-surface" />
                    <div className="h-20 rounded-lg border border-border bg-surface" />
                  </div>
                </div>
              )}
            </div>
          </BrowserChrome>
          {/* Overlapping mobile — sits beside, not below */}
          <div className="absolute bottom-0 right-0 w-[34%] overflow-hidden rounded-xl border border-border bg-surface p-1.5 shadow-md sm:w-[30%]">
            <div className="relative aspect-[9/16] overflow-hidden rounded-lg bg-surface-muted">
              {projectImage ? (
                <SiteImage
                  src={projectImage}
                  alt=""
                  fill
                  className="object-cover object-top"
                  sizes="140px"
                />
              ) : (
                <div className="absolute inset-0 bg-accent-soft" />
              )}
            </div>
          </div>
        </div>
      </VisualFrame>
    );
  }

  if (variant === "seo") {
    return (
      <VisualFrame className="bg-surface-muted p-4 sm:p-5">
        <div className="grid h-full grid-rows-[1fr_auto] gap-3">
          <div className="grid min-h-0 gap-3 sm:grid-cols-[1.1fr_0.9fr]">
            {/* Site architecture */}
            <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface p-3.5 sm:p-4">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-accent-text">
                Site architecture
              </p>
              <ul className="mt-3 flex flex-1 flex-col justify-center space-y-2.5 text-[0.8125rem] sm:text-sm">
                {["Home", "Services", "Locations", "Resources"].map((page, i) => (
                  <li
                    key={page}
                    className={cn(
                      "flex items-center gap-2 border-l-2 border-accent pl-2.5",
                      i === 1 && "ml-3",
                      i === 2 && "ml-6",
                      i === 3 && "ml-3",
                    )}
                  >
                    <span className="font-medium text-foreground">{page}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Content hierarchy */}
            <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface p-3.5 sm:p-4">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-subtle">
                Content hierarchy
              </p>
              <div className="mt-3 flex flex-1 flex-col justify-center gap-2">
                <div className="h-2.5 w-4/5 rounded bg-accent/50" />
                <div className="h-2 w-3/5 rounded bg-neutral-300" />
                <div className="mt-1 space-y-1.5">
                  <div className="h-1.5 w-full rounded bg-neutral-200" />
                  <div className="h-1.5 w-[90%] rounded bg-neutral-200" />
                  <div className="h-1.5 w-[70%] rounded bg-neutral-200" />
                </div>
                <div className="mt-2 h-2 w-2/5 rounded bg-accent/30" />
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface p-3 sm:p-3.5">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-subtle">
                Metadata
              </p>
              <p className="mt-2 text-sm font-medium text-accent-text">Page title</p>
              <p className="mt-0.5 text-[0.75rem] text-muted">yoursite.com/service</p>
              <p className="mt-1.5 line-clamp-2 text-[0.8125rem] leading-snug text-muted">
                Meta description aligned to search intent.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3 sm:p-3.5">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-subtle">
                Technical health
              </p>
              <ul className="mt-2.5 space-y-1.5">
                {["Crawlability", "Page speed", "Internal links", "Schema"].map(
                  (item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-[0.8125rem] text-foreground sm:text-sm"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      {item}
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>
        </div>
      </VisualFrame>
    );
  }

  // redesign — larger before/after comparison
  return (
    <VisualFrame className="p-0">
      <div className="grid h-full grid-cols-2">
        <div className="relative border-r border-border bg-neutral-300">
          <div className="absolute inset-0 flex flex-col justify-between bg-neutral-500/85 p-3.5 sm:p-4">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-white/85">
              Before
            </p>
            <div className="space-y-2 opacity-70">
              <div className="h-2 w-2/3 rounded bg-white/35" />
              <div className="h-16 rounded border border-white/20 bg-white/10 sm:h-20" />
              <div className="grid grid-cols-2 gap-2">
                <div className="h-8 rounded bg-white/15" />
                <div className="h-8 rounded bg-white/15" />
              </div>
            </div>
          </div>
        </div>
        <div className="relative bg-surface-muted">
          {projectImage ? (
            <SiteImage
              src={projectImage}
              alt={projectImageAlt || `${title} redesign`}
              fill
              className="object-cover object-top"
              sizes="(max-width: 768px) 50vw, 280px"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-surface p-4">
              <div className="h-3 w-1/2 rounded bg-accent/40" />
              <div className="mt-4 h-20 rounded-lg border border-border bg-surface" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-3.5 sm:p-4">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-white">
              After
            </p>
          </div>
        </div>
      </div>
    </VisualFrame>
  );
}
