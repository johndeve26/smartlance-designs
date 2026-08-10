import Link from "next/link";
import { redirect } from "next/navigation";
import { getPortalUser } from "@/lib/portal/session";
import { getPortalAttentionCount } from "@/lib/portal/attention";
import { PortalPageHeader, PortalCard } from "@/components/portal/PortalShell";
import { portalMoreNav } from "@/lib/portal/navigation";

export const dynamic = "force-dynamic";

const DESCRIPTIONS: Record<string, string> = {
  "/portal/websites": "Managed websites and care",
  "/portal/support": "Help requests",
  "/portal/approvals": "Reviews and signatures",
  "/portal/documents": "Proposals and contracts",
  "/portal/account": "Profile and team",
  "/portal/logout": "End your session",
};

export default async function PortalMorePage() {
  const user = await getPortalUser();
  if (!user) redirect("/portal/login");

  const attentionCount = await getPortalAttentionCount(user.id).catch(() => 0);

  return (
    <div>
      <PortalPageHeader title="More" description="Additional portal sections." />
      <div className="space-y-3">
        {portalMoreNav.map((link) => (
          <Link key={link.href} href={link.href}>
            <PortalCard className="flex items-center justify-between transition-colors hover:bg-surface-muted">
              <div>
                <p className="font-medium text-foreground">{link.label}</p>
                <p className="text-sm text-muted">{DESCRIPTIONS[link.href]}</p>
              </div>
              {link.badgeKey === "approvals" && attentionCount > 0 ? (
                <span className="rounded-full bg-cta px-2.5 py-0.5 text-xs font-medium text-cta-foreground">
                  {attentionCount}
                </span>
              ) : (
                <span className="text-subtle">→</span>
              )}
            </PortalCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
