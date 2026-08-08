import Image from "next/image";
import type { ReactNode } from "react";
import type { ServiceVisualVariant } from "@/types";
import { cn } from "@/lib/utils";

type ServiceDetailVisualProps = {
  variant: ServiceVisualVariant;
  title: string;
  projectImage?: string;
  projectImageAlt?: string;
};

function Frame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-[5/4] overflow-hidden rounded-xl border border-border bg-surface-muted shadow-sm sm:aspect-[4/3]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Browser({
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
      <div className="flex items-center gap-1.5 border-b border-border px-2.5 py-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
        <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
        <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
        <span className="ml-1.5 h-3 flex-1 rounded bg-surface-muted" />
      </div>
      {children}
    </div>
  );
}

function ProjectFill({
  src,
  alt,
}: {
  src?: string;
  alt: string;
}) {
  if (!src) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-surface-muted p-4">
        <div className="h-3 w-1/2 rounded bg-accent/35" />
        <div className="mt-4 h-24 rounded-lg border border-border bg-surface" />
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover object-top"
      sizes="(max-width: 1024px) 100vw, 560px"
      priority
    />
  );
}

export function ServiceDetailVisual({
  variant,
  title,
  projectImage,
  projectImageAlt,
}: ServiceDetailVisualProps) {
  const alt = projectImageAlt || title;
  const resolved: ServiceVisualVariant =
    variant === "strategy" || variant === "uiux" || variant === "branding"
      ? "design"
      : variant === "performance" || variant === "migration"
        ? "development"
        : variant === "audit" || variant === "analytics"
          ? "cro"
          : variant === "copywriting"
            ? "landing"
            : variant;

  if (resolved === "design") {
    return (
      <Frame className="p-4 sm:p-5">
        <div className="relative flex h-full items-stretch gap-3">
          <div className="hidden w-[30%] flex-col gap-2 rounded-lg border border-dashed border-border bg-surface/90 p-3 sm:flex">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-accent-text">
              Wireframe
            </p>
            <div className="mt-1 space-y-2">
              <div className="h-1.5 w-3/4 rounded bg-neutral-300" />
              <div className="h-14 rounded border border-border bg-surface" />
              <div className="grid grid-cols-2 gap-1.5">
                <div className="h-8 rounded bg-neutral-200" />
                <div className="h-8 rounded bg-neutral-200" />
              </div>
              <div className="h-1.5 w-1/2 rounded bg-accent/40" />
            </div>
          </div>
          <div className="relative min-h-0 flex-1">
            <Browser className="absolute inset-0 flex flex-col">
              <div className="relative min-h-0 flex-1">
                <ProjectFill src={projectImage} alt={alt} />
              </div>
            </Browser>
            <div className="absolute bottom-2 right-2 w-[28%] overflow-hidden rounded-lg border border-border bg-surface p-1 shadow-md">
              <div className="relative aspect-[9/16] overflow-hidden rounded-md bg-surface-muted">
                {projectImage ? (
                  <Image
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
      </Frame>
    );
  }

  if (resolved === "development") {
    return (
      <Frame className="p-4 sm:p-5">
        <div className="relative h-full">
          <Browser className="absolute inset-0 right-[18%] flex flex-col sm:right-[22%]">
            <div className="relative min-h-0 flex-1">
              <ProjectFill src={projectImage} alt={alt} />
            </div>
          </Browser>
          <div className="absolute bottom-0 right-0 w-[34%] overflow-hidden rounded-xl border border-border bg-surface p-1.5 shadow-md sm:w-[30%]">
            <div className="relative aspect-[9/16] overflow-hidden rounded-lg bg-surface-muted">
              {projectImage ? (
                <Image
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
          <div className="absolute left-3 top-3 rounded-md border border-border bg-surface/95 px-2.5 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-accent-text shadow-sm">
            Responsive build
          </div>
        </div>
      </Frame>
    );
  }

  if (resolved === "redesign") {
    return (
      <Frame className="p-0">
        <div className="grid h-full grid-cols-2">
          <div className="relative border-r border-border bg-neutral-400">
            <div className="absolute inset-0 flex flex-col justify-between bg-neutral-600/85 p-3.5 sm:p-4">
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
          <div className="relative">
            <ProjectFill src={projectImage} alt={`${title} after redesign`} />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-3.5 sm:p-4">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-white">
                After
              </p>
            </div>
          </div>
        </div>
      </Frame>
    );
  }

  if (resolved === "ecommerce") {
    return (
      <Frame className="p-4 sm:p-5">
        <div className="grid h-full grid-rows-[1fr_auto] gap-3">
          <Browser className="min-h-0 flex flex-col">
            <div className="relative min-h-0 flex-1">
              <ProjectFill src={projectImage} alt={alt} />
            </div>
          </Browser>
          <div className="grid grid-cols-3 gap-2">
            {["Collection", "Product", "Checkout"].map((step, i) => (
              <div
                key={step}
                className="rounded-lg border border-border bg-surface px-2 py-2.5 text-center"
              >
                <span className="font-display text-xs font-semibold text-accent-text">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="mt-1 text-[0.75rem] font-medium text-foreground">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Frame>
    );
  }

  if (resolved === "landing") {
    return (
      <Frame className="p-4 sm:p-5">
        <Browser className="flex h-full flex-col">
          <div className="flex min-h-0 flex-1 flex-col gap-3 bg-surface p-4 sm:p-5">
            <div className="h-2.5 w-2/5 rounded bg-accent/50" />
            <div className="h-2 w-3/5 rounded bg-neutral-300" />
            <div className="mt-1 space-y-1.5">
              <div className="h-1.5 w-full rounded bg-neutral-200" />
              <div className="h-1.5 w-[85%] rounded bg-neutral-200" />
            </div>
            <div className="mt-auto grid gap-3 sm:grid-cols-[1fr_0.85fr]">
              <div className="rounded-lg border border-border bg-surface-muted p-3">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-subtle">
                  Campaign journey
                </p>
                <ul className="mt-2 space-y-1.5 text-sm text-foreground">
                  {["Offer", "Proof", "CTA"].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-border bg-surface p-3">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-subtle">
                  Enquiry form
                </p>
                <div className="mt-2 space-y-1.5">
                  <div className="h-6 rounded border border-border bg-surface-muted" />
                  <div className="h-6 rounded border border-border bg-surface-muted" />
                  <div className="h-7 rounded bg-cta" />
                </div>
              </div>
            </div>
          </div>
        </Browser>
      </Frame>
    );
  }

  if (resolved === "cro") {
    return (
      <Frame className="p-4 sm:p-5">
        <div className="grid h-full gap-3 sm:grid-cols-2">
          <div className="flex flex-col rounded-lg border border-border bg-surface p-3.5">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-accent-text">
              Page hierarchy
            </p>
            <div className="mt-3 flex flex-1 flex-col justify-center gap-2">
              <div className="h-3 w-4/5 rounded bg-accent/45" />
              <div className="h-2 w-3/5 rounded bg-neutral-300" />
              <div className="mt-2 space-y-1.5">
                <div className="h-1.5 w-full rounded bg-neutral-200" />
                <div className="h-1.5 w-[90%] rounded bg-neutral-200" />
              </div>
              <div className="mt-3 h-8 w-2/5 rounded-md bg-cta" />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex-1 rounded-lg border border-border bg-surface p-3.5">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-subtle">
                User journey
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {["Land", "Understand", "Trust", "Act"].map((step, i) => (
                  <li key={step} className="flex items-center gap-2">
                    <span className="font-display text-xs font-semibold text-accent-text">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3.5">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-subtle">
                Friction checks
              </p>
              <p className="mt-2 text-sm text-muted">
                CTA placement · form length · next-step clarity
              </p>
            </div>
          </div>
        </div>
      </Frame>
    );
  }

  if (resolved === "maintenance") {
    return (
      <Frame className="p-4 sm:p-5">
        <div className="grid h-full gap-3 sm:grid-cols-2">
          {[
            { title: "Updates", detail: "Software, plugins, dependencies" },
            { title: "Backups", detail: "Recovery readiness protected" },
            { title: "Monitoring", detail: "Uptime and issue alerts" },
            { title: "Performance", detail: "Speed and technical health" },
          ].map((item, i) => (
            <div
              key={item.title}
              className="flex flex-col justify-between rounded-lg border border-border bg-surface p-3.5 sm:p-4"
            >
              <span className="font-display text-sm font-semibold text-accent-text">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="mt-auto pt-4">
                <p className="font-display text-lg font-semibold">{item.title}</p>
                <p className="mt-1 text-sm text-muted">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </Frame>
    );
  }

  // marketing
  return (
    <Frame className="p-4 sm:p-5">
      <div className="grid h-full grid-rows-[auto_1fr] gap-3">
        <div className="flex flex-wrap gap-2">
          {["Search", "Content", "Campaign", "Convert"].map((label) => (
            <span
              key={label}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground"
            >
              {label}
            </span>
          ))}
        </div>
        <Browser className="min-h-0 flex flex-col">
          <div className="relative min-h-0 flex-1">
            <ProjectFill src={projectImage} alt={alt} />
          </div>
        </Browser>
      </div>
    </Frame>
  );
}
