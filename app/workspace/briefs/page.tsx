import { redirect } from "next/navigation";
import Link from "next/link";
import { getPortalUser } from "@/lib/portal/session";
import { listBriefsForUser } from "@/lib/prospect/briefs/service";
import { ProspectPageHeader } from "@/components/prospect/ProspectShell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SemanticBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/ui/format";

export default async function WorkspaceBriefsPage() {
  const user = await getPortalUser();
  if (!user) redirect("/workspace/login");

  const briefs = await listBriefsForUser(user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <ProspectPageHeader
        title="Project Briefs"
        description="Website briefs you are building or have sent to Smartlance."
        action={
          <Button asChild size="sm">
            <Link href="/website-brief">New brief</Link>
          </Button>
        }
      />

      {briefs.length === 0 ? (
        <EmptyState
          title="No briefs yet"
          description="Build a website brief to plan your project and send it to Smartlance."
          action={
            <Button asChild>
              <Link href="/website-brief">Start a brief</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {briefs.map((b) => (
            <li key={b.id}>
              <Link
                href={`/workspace/briefs/${b.id}`}
                className="block rounded-lg border border-border bg-surface p-4 transition-colors hover:bg-surface-muted"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-medium text-foreground">{b.title}</p>
                  <SemanticBadge tone="neutral">{b.status}</SemanticBadge>
                </div>
                <p className="mt-1 text-body-sm text-muted">
                  {b.completionPercent}% complete · Updated {formatDate(b.updatedAt)}
                </p>
                {b.status === "DRAFT" ? (
                  <p className="mt-2 text-xs font-medium text-accent-text">Continue →</p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
