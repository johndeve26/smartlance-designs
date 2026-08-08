import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SeoDetailVisualProps = {
  variant: "technical" | "local" | "onpage" | "audit";
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
        "relative min-h-[24rem] overflow-hidden rounded-xl border border-border bg-surface-muted shadow-md sm:min-h-[28rem] lg:min-h-[30rem]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function BrowserShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-[inherit] flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex items-center gap-1.5 border-b border-border px-3 py-2.5">
        <span className="h-2 w-2 rounded-full bg-neutral-300" />
        <span className="h-2 w-2 rounded-full bg-neutral-300" />
        <span className="h-2 w-2 rounded-full bg-neutral-300" />
        <span className="ml-2 h-3.5 flex-1 rounded bg-surface-muted" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">{children}</div>
    </div>
  );
}

export function SeoDetailVisual({ variant }: SeoDetailVisualProps) {
  if (variant === "technical") {
    return (
      <Frame className="bg-gradient-to-br from-surface-muted via-surface to-orange-50/40 p-3 sm:p-4">
        <BrowserShell>
          <div className="grid h-full min-h-[20rem] gap-3 sm:grid-cols-[1.1fr_0.9fr] sm:gap-4">
            <div className="flex flex-col rounded-lg border border-border bg-surface-muted/80 p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-text">
                Site architecture
              </p>
              <ul className="mt-4 flex flex-1 flex-col justify-center gap-2.5 text-[0.9375rem] sm:gap-3 sm:text-base">
                {["Home", "Services", "Locations", "Resources", "Contact"].map(
                  (page, i) => (
                    <li
                      key={page}
                      className={cn(
                        "border-l-[3px] border-accent pl-3 font-medium text-foreground",
                        i === 1 && "ml-3",
                        i === 2 && "ml-6",
                        i === 3 && "ml-3",
                        i === 4 && "ml-0",
                      )}
                    >
                      {page}
                    </li>
                  ),
                )}
              </ul>
            </div>
            <div className="grid grid-rows-[auto_auto_1fr] gap-3">
              <div className="rounded-lg border border-border bg-surface p-3.5 sm:p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
                  Crawl paths
                </p>
                <ul className="mt-2.5 space-y-1.5 text-[0.9375rem]">
                  {["Accessible", "Indexable", "Canonical clear"].map((item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <span className="h-2 w-2 rounded-full bg-accent" />
                      <span className="font-medium text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-border bg-surface p-3.5 sm:p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
                  Metadata
                </p>
                <p className="mt-2 text-[0.9375rem] font-semibold text-accent-text">
                  Page title
                </p>
                <p className="mt-1 text-sm text-muted">yoursite.com/service</p>
                <p className="mt-1.5 text-sm leading-snug text-muted">
                  Description aligned to search intent.
                </p>
              </div>
              <div className="flex flex-col justify-center rounded-lg border border-border bg-surface p-3.5 sm:p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
                  Performance
                </p>
                <p className="mt-2 text-[0.9375rem] text-foreground">
                  Speed · redirects · schema · mobile
                </p>
              </div>
            </div>
          </div>
        </BrowserShell>
      </Frame>
    );
  }

  if (variant === "local") {
    return (
      <Frame className="bg-gradient-to-br from-surface-muted via-surface to-orange-50/40 p-3 sm:p-4">
        <BrowserShell>
          <div className="grid h-full gap-4 sm:grid-cols-2">
            <div className="flex flex-col rounded-lg border border-border bg-surface-muted/80 p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-text">
                Local discovery
              </p>
              <div className="mt-5 flex flex-1 flex-col justify-center gap-4">
                <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-accent" />
                    <div>
                      <p className="text-base font-semibold text-foreground">
                        Local business
                      </p>
                      <p className="mt-1 text-[0.9375rem] text-muted">
                        Service · City
                      </p>
                    </div>
                  </div>
                </div>
                <div className="relative flex-1 overflow-hidden rounded-lg border border-dashed border-border bg-surface p-4">
                  <div className="absolute inset-4 rounded-full border border-accent/25" />
                  <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" />
                  <p className="relative mt-auto pt-16 text-center text-sm text-muted">
                    Service-area context
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex-1 rounded-lg border border-border bg-surface p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
                  Location pages
                </p>
                <ul className="mt-4 space-y-3 text-[0.9375rem] sm:text-base">
                  {[
                    "Service area page",
                    "Local offer clarity",
                    "Clear next-step CTA",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <span className="h-2 w-2 rounded-full bg-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-border bg-surface p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
                  Local signals
                </p>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-foreground sm:text-base">
                  Profile · consistency · reviews · schema
                </p>
              </div>
            </div>
          </div>
        </BrowserShell>
      </Frame>
    );
  }

  if (variant === "onpage") {
    return (
      <Frame className="bg-gradient-to-br from-surface-muted via-surface to-orange-50/40 p-3 sm:p-4">
        <BrowserShell>
          <div className="flex h-full flex-col gap-4">
            <div className="rounded-lg border border-border bg-surface-muted/80 p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-text">
                Content hierarchy
              </p>
              <div className="mt-4 space-y-2.5">
                <div className="h-3.5 w-4/5 rounded bg-accent/50" />
                <div className="h-2.5 w-3/5 rounded bg-neutral-300" />
                <div className="mt-3 space-y-2">
                  <div className="h-2 w-full rounded bg-neutral-200" />
                  <div className="h-2 w-[92%] rounded bg-neutral-200" />
                  <div className="h-2 w-[78%] rounded bg-neutral-200" />
                </div>
                <div className="mt-4 h-9 w-2/5 rounded-md bg-cta" />
              </div>
            </div>
            <div className="grid flex-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-surface p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
                  Title / meta
                </p>
                <p className="mt-3 text-base font-semibold text-accent-text">
                  Page title
                </p>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
                  Meta description matched to intent
                </p>
              </div>
              <div className="rounded-lg border border-border bg-surface p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
                  Internal links + CTA
                </p>
                <ul className="mt-3 space-y-2.5 text-[0.9375rem] sm:text-base">
                  {["Related service", "Supporting page", "Conversion path"].map(
                    (item) => (
                      <li key={item} className="flex items-center gap-2.5">
                        <span className="h-2 w-2 rounded-full bg-accent" />
                        {item}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </div>
          </div>
        </BrowserShell>
      </Frame>
    );
  }

  // audit
  return (
    <Frame className="bg-gradient-to-br from-surface-muted via-surface to-orange-50/40 p-3 sm:p-4">
      <BrowserShell>
        <div className="grid h-full gap-4 sm:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col rounded-lg border border-border bg-surface-muted/80 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-text">
              Priority concept
            </p>
            <ul className="mt-5 flex flex-1 flex-col justify-center gap-4">
              {[
                { label: "Critical", tone: "bg-accent" },
                { label: "High", tone: "bg-orange-300" },
                { label: "Medium", tone: "bg-neutral-300" },
                { label: "Opportunity", tone: "bg-neutral-200" },
              ].map((item) => (
                <li
                  key={item.label}
                  className="flex items-center gap-3 text-base font-semibold text-foreground"
                >
                  <span className={cn("h-3 w-3 rounded-full", item.tone)} />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex-1 rounded-lg border border-border bg-surface p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
                Diagnostic areas
              </p>
              <ul className="mt-4 grid grid-cols-2 gap-2.5 text-[0.9375rem] sm:text-base">
                {[
                  "Technical",
                  "On-page",
                  "Content",
                  "Architecture",
                  "Performance",
                  "Local",
                ].map((item) => (
                  <li
                    key={item}
                    className="rounded-md border border-border bg-surface-muted px-3 py-2.5 font-medium"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
                Output
              </p>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-foreground sm:text-base">
                Findings · impact · recommended actions
              </p>
            </div>
          </div>
        </div>
      </BrowserShell>
    </Frame>
  );
}
