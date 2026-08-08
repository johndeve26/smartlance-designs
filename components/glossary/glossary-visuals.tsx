import { cn } from "@/lib/utils";

type VisualProps = { className?: string };

export function GlossaryClsVisual({ className }: VisualProps) {
  return (
    <figure
      className={cn(
        "my-8 overflow-hidden rounded-xl border border-border bg-surface-muted",
        className,
      )}
      aria-label="Illustration of unexpected layout shift when an image loads without reserved space"
    >
      <div className="border-b border-border bg-surface px-4 py-3">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent-text">
          Layout shift example
        </p>
      </div>
      <div className="grid gap-0 sm:grid-cols-2">
        <div className="border-b border-border p-5 sm:border-b-0 sm:border-r">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
            Before
          </p>
          <div className="mt-4 space-y-3">
            <div className="h-2 w-[88%] rounded-full bg-border" />
            <div className="h-2 w-[70%] rounded-full bg-border/80" />
            <div className="mt-4 inline-flex rounded-md border border-border bg-surface px-3 py-2 text-sm font-semibold text-foreground">
              Button
            </div>
          </div>
        </div>
        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
            After image loads
          </p>
          <div className="mt-4 space-y-3">
            <div className="aspect-[16/7] rounded-md border border-dashed border-accent/50 bg-accent/10" />
            <div className="h-2 w-[88%] rounded-full bg-border" />
            <div className="inline-flex translate-y-1 rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-sm font-semibold text-accent-text">
              Button moved
            </div>
          </div>
        </div>
      </div>
      <figcaption className="sr-only">
        When an image loads without reserved space, content below it can shift
        unexpectedly — the kind of movement CLS measures.
      </figcaption>
    </figure>
  );
}

export function GlossaryCanonicalVsRedirectVisual({ className }: VisualProps) {
  return (
    <figure
      className={cn("my-8 grid gap-3 sm:grid-cols-2", className)}
      aria-label="Comparison of canonical URL signals versus 301 redirects"
    >
      <div className="rounded-xl border border-border bg-surface-muted p-5">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent-text">
          Canonical
        </p>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
          Both URLs can still be visited. The signal tells search engines which
          version is preferred.
        </p>
      </div>
      <div className="rounded-xl border border-border bg-surface-muted p-5">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent-text">
          301 Redirect
        </p>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
          The request is sent from the old URL to a different destination. Users
          land on the new URL.
        </p>
      </div>
    </figure>
  );
}

export function GlossaryCwvVisual({ className }: VisualProps) {
  const items = [
    { label: "LCP", body: "Loading" },
    { label: "INP", body: "Responsiveness" },
    { label: "CLS", body: "Visual stability" },
  ] as const;
  return (
    <figure
      className={cn(
        "my-8 overflow-hidden rounded-xl border border-border bg-surface",
        className,
      )}
      aria-label="Core Web Vitals relationship: LCP, INP and CLS"
    >
      <div className="border-b border-border bg-surface-muted px-4 py-3">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent-text">
          Core Web Vitals
        </p>
      </div>
      <ul className="grid sm:grid-cols-3">
        {items.map((item, index) => (
          <li
            key={item.label}
            className={cn(
              "p-5",
              index < items.length - 1 && "border-b border-border sm:border-b-0 sm:border-r",
            )}
          >
            <p className="font-display text-2xl font-semibold text-foreground">
              {item.label}
            </p>
            <p className="mt-2 text-sm text-muted">{item.body}</p>
          </li>
        ))}
      </ul>
    </figure>
  );
}

export function GlossaryCtaHierarchyVisual({ className }: VisualProps) {
  return (
    <figure
      className={cn(
        "my-8 rounded-xl border border-border bg-surface-muted p-5 sm:p-6",
        className,
      )}
      aria-label="Primary and secondary call to action hierarchy"
    >
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent-text">
        CTA hierarchy
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1 rounded-lg bg-cta px-4 py-3 text-center text-sm font-semibold text-cta-foreground">
          Primary action
        </div>
        <div className="flex-1 rounded-lg border border-border bg-surface px-4 py-3 text-center text-sm font-semibold text-foreground">
          Secondary action
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        Multiple actions can exist, but equal emphasis everywhere makes the next
        step unclear.
      </p>
    </figure>
  );
}

export function GlossarySitemapVisual({ className }: VisualProps) {
  return (
    <figure
      className={cn("my-8 grid gap-3 sm:grid-cols-2", className)}
      aria-label="Difference between website navigation and an XML sitemap"
    >
      <div className="rounded-xl border border-border bg-surface p-5">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent-text">
          Navigation
        </p>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
          HTML links help people and crawlers move through the site.
        </p>
      </div>
      <div className="rounded-xl border border-border bg-surface p-5">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent-text">
          XML sitemap
        </p>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
          A separate machine-readable list that aids discovery — it does not
          replace internal linking.
        </p>
      </div>
    </figure>
  );
}

export function GlossaryVisual({
  visual,
}: {
  visual: NonNullable<
    import("@/data/resource-content-types").GlossaryContent["visual"]
  >;
}) {
  switch (visual) {
    case "cls-shift":
      return <GlossaryClsVisual />;
    case "canonical-vs-redirect":
      return <GlossaryCanonicalVsRedirectVisual />;
    case "cwv-relationship":
      return <GlossaryCwvVisual />;
    case "cta-hierarchy":
      return <GlossaryCtaHierarchyVisual />;
    case "sitemap-relationship":
      return <GlossarySitemapVisual />;
    default:
      return null;
  }
}
