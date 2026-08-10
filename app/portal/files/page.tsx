import { redirect } from "next/navigation";
import { getPortalUser } from "@/lib/portal/session";
import { getPortalFiles } from "@/lib/portal/files";
import { listPortalProjects } from "@/lib/portal/home";
import type { PortalFileCategory } from "@/lib/portal/files";
import { PortalPageHeader } from "@/components/portal/PortalShell";
import { PortalFileLibrary } from "@/components/portal/PortalFileLibrary";

export const dynamic = "force-dynamic";

export default async function PortalFilesPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; category?: string; q?: string }>;
}) {
  const user = await getPortalUser();
  if (!user) redirect("/portal/login");

  const params = await searchParams;
  const category = params.category as PortalFileCategory | undefined;

  const [files, projects] = await Promise.all([
    getPortalFiles({
      portalUserId: user.id,
      projectId: params.projectId,
      category,
      q: params.q,
    }),
    listPortalProjects(user.id),
  ]);

  return (
    <div>
      <PortalPageHeader
        title="Files"
        description="Files you've shared and deliverables from Smartlance."
      />
      <PortalFileLibrary
        files={files}
        projects={projects.map((p) => ({ id: p.id, name: p.name }))}
        currentProjectId={params.projectId}
        currentCategory={params.category}
        currentQuery={params.q}
      />
    </div>
  );
}
