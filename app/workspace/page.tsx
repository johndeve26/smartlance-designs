import { redirect } from "next/navigation";
import Link from "next/link";
import { getPortalUser } from "@/lib/portal/session";
import { getProspectHome } from "@/lib/prospect/workspace/home";
import { ProspectPageHeader } from "@/components/prospect/ProspectShell";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default async function WorkspaceHomePage() {
  const user = await getPortalUser();
  if (!user) redirect("/workspace/login");

  const home = await getProspectHome(user.id);

  const hasContent =
    home.proposalReady.length > 0 ||
    home.continueReview ||
    home.continueBrief ||
    home.activeRequest ||
    home.recentReviews.length > 0 ||
    home.recentBriefs.length > 0;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <ProspectPageHeader
        title={home.firstName ? `Welcome back, ${home.firstName}` : "Your workspace"}
        description="Plan, review and send your website project to Smartlance."
      />

      {home.hasClientAccess ? (
        <div className="rounded-lg border border-accent/30 bg-surface p-5">
          <p className="font-medium text-foreground">Your Smartlance project is ready</p>
          <p className="mt-1 text-body-sm">
            Continue in the Client Portal for projects, files and billing.
          </p>
          <Button asChild className="mt-4">
            <Link href="/portal">Open Client Portal</Link>
          </Button>
        </div>
      ) : null}

      {home.proposalReady.length > 0 ? (
        <section>
          <h2 className="text-section-heading">Your proposal is ready</h2>
          {home.proposalReady.map((p) => (
            <div
              key={p.proposalId || p.requestId}
              className="mt-3 rounded-lg border border-accent/30 bg-surface p-4"
            >
              <p className="font-medium">{p.title}</p>
              <p className="mt-1 text-body-sm">
                Smartlance has prepared a proposal based on your project details.
              </p>
              {p.proposalId ? (
                <Button asChild size="sm" className="mt-3">
                  <Link href={`/portal/proposals/${p.proposalId}`}>Review proposal</Link>
                </Button>
              ) : (
                <Link
                  href={`/workspace/requests/${p.requestId}`}
                  className="mt-3 inline-block text-sm font-medium text-accent-text hover:underline"
                >
                  View request
                </Link>
              )}
            </div>
          ))}
        </section>
      ) : null}

      {(home.continueReview || home.continueBrief) ? (
        <section>
          <h2 className="text-section-heading">Continue where you left off</h2>
          <div className="mt-3 space-y-3">
            {home.continueBrief ? (
              <div className="rounded-lg border border-border bg-surface p-4">
                <p className="text-xs font-medium text-accent-text">Website Brief</p>
                <p className="mt-1 font-medium">{home.continueBrief.title}</p>
                <p className="text-sm text-muted">
                  {home.continueBrief.completionPercent}% complete
                </p>
                <Link
                  href={`/workspace/briefs/${home.continueBrief.id}`}
                  className="mt-3 inline-block text-sm font-medium text-accent-text hover:underline"
                >
                  Continue
                </Link>
              </div>
            ) : null}
            {home.continueReview ? (
              <div className="rounded-lg border border-border bg-surface p-4">
                <p className="text-xs font-medium text-accent-text">Website Review</p>
                <p className="mt-1 font-medium">{home.continueReview.normalizedDomain}</p>
                <p className="text-sm text-muted">{home.continueReview.statusLabel}</p>
                <Link
                  href={`/workspace/reviews/${home.continueReview.id}`}
                  className="mt-3 inline-block text-sm font-medium text-accent-text hover:underline"
                >
                  View review
                </Link>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {home.recentReviews.length > 0 ? (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-section-heading">Saved website reviews</h2>
            <Link href="/workspace/reviews" className="text-sm font-medium text-accent-text hover:underline">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
            {home.recentReviews.map((review) => (
              <li key={review.id}>
                <Link
                  href={`/workspace/reviews/${review.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-surface-muted/50"
                >
                  <div>
                    <p className="font-medium">{review.normalizedDomain}</p>
                    <p className="text-sm text-muted">{review.statusLabel}</p>
                  </div>
                  <span className="text-sm text-accent-text">Open</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {home.recentBriefs.length > 0 ? (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-section-heading">Website briefs</h2>
            <Link href="/workspace/briefs" className="text-sm font-medium text-accent-text hover:underline">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
            {home.recentBriefs.map((brief) => (
              <li key={brief.id}>
                <Link
                  href={`/workspace/briefs/${brief.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-surface-muted/50"
                >
                  <div>
                    <p className="font-medium">{brief.title}</p>
                    <p className="text-sm text-muted">{brief.completionPercent}% complete</p>
                  </div>
                  <span className="text-sm text-accent-text">Open</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {home.activeRequest ? (
        <section>
          <h2 className="text-section-heading">Your request</h2>
          <div className="mt-3 rounded-lg border border-border bg-surface p-4">
            <p className="font-medium">{home.activeRequest.title}</p>
            <p className="text-sm text-muted">{home.activeRequest.statusLabel}</p>
            <Link
              href={`/workspace/requests/${home.activeRequest.id}`}
              className="mt-3 inline-block text-sm font-medium text-accent-text hover:underline"
            >
              View request
            </Link>
          </div>
        </section>
      ) : null}

      {!hasContent ? (
        <EmptyState
          title="Plan your next website project"
          description="Start with a free website review or build a detailed project brief."
          action={
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/free-website-review">Review an existing website</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/website-brief">Build a website brief</Link>
              </Button>
            </div>
          }
        />
      ) : null}
    </div>
  );
}
