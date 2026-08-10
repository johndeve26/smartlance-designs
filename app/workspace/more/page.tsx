import Link from "next/link";
import { redirect } from "next/navigation";
import { getPortalUser } from "@/lib/portal/session";
import { ProspectPageHeader } from "@/components/prospect/ProspectShell";
import { prospectMoreNav } from "@/lib/prospect/navigation";

export const dynamic = "force-dynamic";

const DESCRIPTIONS: Record<string, string> = {
  "/workspace/account": "Profile and preferences",
  "/workspace/logout": "End your session",
};

export default async function WorkspaceMorePage() {
  const user = await getPortalUser();
  if (!user) redirect("/workspace/login");

  return (
    <div>
      <ProspectPageHeader title="More" description="Account and session." />
      <div className="space-y-2">
        {prospectMoreNav.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:bg-surface-muted"
          >
            <div>
              <p className="font-medium text-foreground">{link.label}</p>
              {DESCRIPTIONS[link.href] ? (
                <p className="text-sm text-muted">{DESCRIPTIONS[link.href]}</p>
              ) : null}
            </div>
            <span className="text-subtle">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
