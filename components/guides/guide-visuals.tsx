import { cn } from "@/lib/utils";

type VisualProps = {
  className?: string;
};

export function RedesignLifecycleVisual({ className }: VisualProps) {
  const steps = [
    "Current site",
    "Audit",
    "Structure",
    "Design",
    "Build",
    "Launch",
  ] as const;

  return (
    <figure
      className={cn(
        "my-10 overflow-hidden rounded-xl border border-border bg-surface-muted",
        className,
      )}
      aria-label="Website redesign lifecycle from current site through audit, structure, design, build and launch"
    >
      <div className="border-b border-border bg-surface px-4 py-3 sm:px-5">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent-text">
          Redesign lifecycle
        </p>
      </div>
      <ol className="grid gap-0 sm:grid-cols-3 lg:grid-cols-6">
        {steps.map((step, index) => (
          <li
            key={step}
            className="relative flex flex-col gap-2 border-b border-border p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 sm:p-5"
          >
            <span className="font-display text-xs font-semibold tabular-nums text-accent-text">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[0.9375rem] font-semibold text-foreground">
              {step}
            </span>
            <span
              className="mt-1 h-1.5 w-10 rounded-full bg-accent/45"
              aria-hidden
            />
          </li>
        ))}
      </ol>
      <figcaption className="sr-only">
        Redesign typically moves from the current site through audit, structure,
        design, build and launch — not from a new visual concept alone.
      </figcaption>
    </figure>
  );
}

export function RefreshRedesignRebuildVisual({ className }: VisualProps) {
  const items = [
    {
      label: "Refresh",
      body: "Targeted visual and content improvements without a full restructure.",
    },
    {
      label: "Redesign",
      body: "Broader changes to presentation, structure and user experience.",
    },
    {
      label: "Rebuild",
      body: "Substantial technical or platform change alongside the redesign.",
    },
  ] as const;

  return (
    <figure
      className={cn(
        "my-10 grid gap-3 sm:grid-cols-3",
        className,
      )}
      aria-label="Refresh, redesign and rebuild compared at a high level"
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-border bg-surface-muted p-5"
        >
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent-text">
            {item.label}
          </p>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
            {item.body}
          </p>
        </div>
      ))}
      <figcaption className="sr-only sm:col-span-3">
        A refresh is narrower than a redesign. A rebuild also changes the
        underlying technical foundation.
      </figcaption>
    </figure>
  );
}

export function SitemapVisual({ className }: VisualProps) {
  return (
    <figure
      className={cn(
        "my-10 overflow-hidden rounded-xl border border-border bg-surface",
        className,
      )}
      aria-label="Illustrative website sitemap example"
    >
      <div className="border-b border-border bg-surface-muted px-4 py-3 sm:px-5">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent-text">
          Illustrative sitemap
        </p>
        <p className="mt-1 text-sm text-muted">
          Example only — not a required structure for every website.
        </p>
      </div>
      <pre className="overflow-x-auto p-5 font-mono text-[0.8125rem] leading-[1.7] text-foreground sm:p-6 sm:text-sm">
        {`HOME
├── SERVICES
│   ├── Service A
│   └── Service B
├── WORK
├── ABOUT
├── RESOURCES
└── CONTACT`}
      </pre>
    </figure>
  );
}

export function ContentDecisionVisual({ className }: VisualProps) {
  const decisions = [
    { label: "Keep", hint: "Still accurate and useful" },
    { label: "Improve", hint: "Worth retaining with edits" },
    { label: "Merge", hint: "Overlapping pages combine" },
    { label: "Remove", hint: "No longer serves the business" },
    { label: "Redirect", hint: "Preserve paths that matter" },
  ] as const;

  return (
    <figure
      className={cn("my-10", className)}
      aria-label="Content decisions: keep, improve, merge, remove, redirect"
    >
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {decisions.map((item) => (
          <li
            key={item.label}
            className="rounded-xl border border-border bg-surface-muted px-4 py-4"
          >
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent-text">
              {item.label}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{item.hint}</p>
          </li>
        ))}
      </ul>
    </figure>
  );
}

export function SeoRisksVisual({ className }: VisualProps) {
  const risks = [
    "Missing redirects",
    "Removed valuable pages",
    "Accidental noindex",
    "Incorrect canonical",
    "Broken internal links",
    "Missing metadata",
    "Robots changes",
    "Sitemap mistakes",
  ] as const;

  return (
    <figure
      className={cn(
        "my-10 rounded-xl border border-border bg-surface-muted p-5 sm:p-6",
        className,
      )}
      aria-label="Common SEO risks during website redesign"
    >
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent-text">
        SEO migration risks
      </p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {risks.map((risk) => (
          <li
            key={risk}
            className="flex items-start gap-2 text-[0.9375rem] text-foreground"
          >
            <span
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
              aria-hidden
            />
            {risk}
          </li>
        ))}
      </ul>
    </figure>
  );
}

export function LaunchPhasesVisual({ className }: VisualProps) {
  const phases = [
    {
      label: "Before",
      items: ["Content freeze", "Backup / reference", "QA complete"],
    },
    {
      label: "Launch",
      items: ["Deploy", "Cutover if needed", "Verify redirects"],
    },
    {
      label: "After",
      items: ["Forms & analytics", "Critical pages", "Sitemap update"],
    },
  ] as const;

  return (
    <figure
      className={cn("my-10 grid gap-3 sm:grid-cols-3", className)}
      aria-label="Launch phases before, during and after go-live"
    >
      {phases.map((phase) => (
        <div
          key={phase.label}
          className="rounded-xl border border-border bg-surface p-5"
        >
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent-text">
            {phase.label}
          </p>
          <ul className="mt-3 space-y-2">
            {phase.items.map((item) => (
              <li key={item} className="text-[0.9375rem] text-muted">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </figure>
  );
}

export function GuideVisual({
  visual,
  wide,
}: {
  visual: NonNullable<
    import("@/data/resource-content-types").ResourceSection["visual"]
  >;
  wide?: boolean;
}) {
  const wrap = wide
    ? "article-image-breakout not-prose"
    : "not-prose";

  switch (visual) {
    case "redesign-lifecycle":
      return (
        <div className={wrap}>
          <RedesignLifecycleVisual />
        </div>
      );
    case "refresh-redesign-rebuild":
      return (
        <div className={wrap}>
          <RefreshRedesignRebuildVisual />
        </div>
      );
    case "sitemap":
      return (
        <div className={wrap}>
          <SitemapVisual />
        </div>
      );
    case "content-decision":
      return (
        <div className={wrap}>
          <ContentDecisionVisual />
        </div>
      );
    case "seo-risks":
      return (
        <div className={wrap}>
          <SeoRisksVisual />
        </div>
      );
    case "launch-phases":
      return (
        <div className={wrap}>
          <LaunchPhasesVisual />
        </div>
      );
    default:
      return null;
  }
}
