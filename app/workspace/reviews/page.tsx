import { redirect } from "next/navigation";
import Link from "next/link";
import { getPortalUser } from "@/lib/portal/session";
import { listReviewsForUser } from "@/lib/prospect/reviews/service";
import { ProspectPageHeader } from "@/components/prospect/ProspectShell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SemanticBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/ui/format";

export default async function WorkspaceReviewsPage() {
  const user = await getPortalUser();
  if (!user) redirect("/workspace/login");

  const reviews = await listReviewsForUser(user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <ProspectPageHeader
        title="Website Reviews"
        description="Saved reviews from the free website review tool."
        action={
          <Button asChild size="sm">
            <Link href="/free-website-review">New review</Link>
          </Button>
        }
      />

      {reviews.length === 0 ? (
        <EmptyState
          title="No saved reviews yet"
          description="Run a free website review to see priorities and recommendations."
          action={
            <Button asChild>
              <Link href="/free-website-review">Start a review</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.id}>
              <Link
                href={`/workspace/reviews/${r.id}`}
                className="block rounded-lg border border-border bg-surface p-4 transition-colors hover:bg-surface-muted"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-medium text-foreground">{r.normalizedDomain}</p>
                  {r.overallDirectionLabel ? (
                    <SemanticBadge tone="neutral">{r.overallDirectionLabel}</SemanticBadge>
                  ) : null}
                </div>
                <p className="mt-1 text-body-sm text-muted">
                  {r.statusLabel} · {formatDate(r.createdAt)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
