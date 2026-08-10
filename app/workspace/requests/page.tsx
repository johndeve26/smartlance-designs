import { redirect } from "next/navigation";
import Link from "next/link";
import { getPortalUser } from "@/lib/portal/session";
import { listRequestsForUser } from "@/lib/prospect/requests/service";
import { ProspectPageHeader } from "@/components/prospect/ProspectShell";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { SemanticBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/ui/format";

export default async function WorkspaceRequestsPage() {
  const user = await getPortalUser();
  if (!user) redirect("/workspace/login");

  const requests = await listRequestsForUser(user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <ProspectPageHeader
        title="Requests"
        description="Project requests you have sent to Smartlance."
      />

      {requests.length === 0 ? (
        <EmptyState
          title="No requests yet"
          description="Build and submit a website brief to send your project to Smartlance."
          action={
            <Button asChild>
              <Link href="/website-brief">Build a brief</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => (
            <li key={r.id}>
              <Link
                href={`/workspace/requests/${r.id}`}
                className="block rounded-lg border border-border bg-surface p-4 transition-colors hover:bg-surface-muted"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-medium text-foreground">{r.title}</p>
                  <SemanticBadge tone="neutral">{r.statusLabel}</SemanticBadge>
                </div>
                <p className="mt-1 text-body-sm text-muted">
                  Submitted {formatDate(r.submittedAt)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
