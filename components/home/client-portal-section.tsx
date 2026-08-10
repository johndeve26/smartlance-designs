import Link from "next/link";
import { Container } from "@/components/ui/container";
import { clientPortalHighlights } from "@/lib/public/how-we-work-content";
import { PUBLIC_CTAS } from "@/lib/public/cta-map";

export function ClientPortalSection() {
  return (
    <section className="section-padding border-y border-border bg-surface">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center">
          <div>
            <p className="eyebrow">Client experience</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              Your Project Doesn&apos;t Disappear Into Email Threads
            </h2>
            <p className="section-deck mt-5 max-w-[42ch]">
              Smartlance clients get a structured workspace for the work that
              matters — projects, approvals, files, documents and billing in
              one place instead of scattered messages.
            </p>
            <ul className="mt-8 space-y-3">
              {clientPortalHighlights.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-[0.9375rem] text-muted"
                >
                  <span
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                    aria-hidden
                  />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-8">
              <Link href={PUBLIC_CTAS.howWeWork.href} className="link-action">
                {PUBLIC_CTAS.howWeWork.label} →
              </Link>
            </p>
          </div>

          <div
            className="rounded-lg border border-border bg-[#FAF9F7] p-6 shadow-sm"
            aria-hidden
          >
            <div className="rounded-md border border-border bg-surface p-4">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-subtle">
                Client portal preview
              </p>
              <p className="mt-3 font-display text-lg font-semibold">
                Nashville Home Viewer
              </p>
              <p className="mt-1 text-sm text-muted">Website redesign · In progress</p>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {["Projects", "Approvals", "Files", "Billing"].map((label) => (
                  <div
                    key={label}
                    className="rounded border border-border bg-surface-muted px-3 py-2 text-sm font-medium text-foreground"
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
