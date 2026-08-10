import { redirect } from "next/navigation";
import { getPortalUser } from "@/lib/portal/session";
import { listPortalProjects } from "@/lib/portal/home";
import { PortalPageHeader, PortalCard } from "@/components/portal/PortalShell";
import { ProjectSummaryList } from "@/components/portal/ProjectSummaryCard";

export const dynamic = "force-dynamic";

export default async function PortalProjectsPage() {
  const user = await getPortalUser();
  if (!user) redirect("/portal/login");

  const projects = await listPortalProjects(user.id);

  return (
    <div>
      <PortalPageHeader
        title="Projects"
        description="Your active and past Smartlance projects."
      />
      <PortalCard>
        <ProjectSummaryList projects={projects} />
      </PortalCard>
    </div>
  );
}
