import Link from "next/link";
import { redirect } from "next/navigation";
import { getPortalUser } from "@/lib/portal/session";
import { getPortalHome } from "@/lib/portal/home";
import { PortalPageHeader, PortalCard } from "@/components/portal/PortalShell";
import { AttentionList } from "@/components/portal/AttentionList";
import { ProjectSummaryCard } from "@/components/portal/ProjectSummaryCard";
import { PortalWebsiteHomeCards } from "@/components/portal/PortalWebsiteCards";
import { PortalTimelineList } from "@/components/portal/PortalTimelineList";
import { ProductSectionHeader } from "@/components/ui/page-header";

export const dynamic = "force-dynamic";

export default async function PortalHomePage() {
  const user = await getPortalUser();
  if (!user) redirect("/portal/login");

  const home = await getPortalHome(user.id);
  const actionable = home.attention.filter((a) => a.canAct);

  return (
    <div className="space-y-8">
      <PortalPageHeader title={home.greeting} description={home.subtitle} />

      <section>
        <ProductSectionHeader
          title="Needs your attention"
          action={
            actionable.length > 0 ? (
              <Link href="/portal/approvals" className="text-sm font-medium text-accent-text hover:underline">
                View all
              </Link>
            ) : undefined
          }
        />
        <AttentionList items={actionable} />
      </section>

      <section>
        <ProductSectionHeader title="Active projects" />
        {home.projects.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {home.projects.map((p) => (
              <ProjectSummaryCard key={p.id} project={p} />
            ))}
          </div>
        ) : (
          <PortalCard>
            <p className="text-body-sm">No active projects right now.</p>
          </PortalCard>
        )}
        <div className="mt-3">
          <Link href="/portal/projects" className="text-sm text-accent-text hover:underline">
            View all projects
          </Link>
        </div>
      </section>

      {home.websites.length ? (
        <section>
          <ProductSectionHeader
            title="Your websites"
            action={
              <Link href="/portal/websites" className="text-sm font-medium text-accent-text hover:underline">
                View all
              </Link>
            }
          />
          <PortalWebsiteHomeCards websites={home.websites} />
        </section>
      ) : null}

      <section>
        <ProductSectionHeader title="Recent updates" />
        <PortalCard>
          <PortalTimelineList events={home.timeline} />
        </PortalCard>
      </section>
    </div>
  );
}
