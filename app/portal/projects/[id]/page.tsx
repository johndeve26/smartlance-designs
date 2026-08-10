import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getPortalUser } from "@/lib/portal/session";
import { getPortalProjectWorkspace } from "@/lib/portal/project-workspace";
import { getPortalFiles } from "@/lib/portal/files";
import { ProjectWorkspaceView } from "@/components/portal/ProjectWorkspaceView";

export const dynamic = "force-dynamic";

export default async function PortalProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getPortalUser();
  if (!user) redirect("/portal/login");

  const { id } = await params;
  const [workspace, projectFiles] = await Promise.all([
    getPortalProjectWorkspace(user.id, id),
    getPortalFiles({ portalUserId: user.id, projectId: id, limit: 50 }),
  ]);

  if (!workspace) notFound();

  return (
    <Suspense fallback={<div className="text-sm text-neutral-600">Loading project…</div>}>
      <ProjectWorkspaceView workspace={workspace} projectFiles={projectFiles} projectId={id} />
    </Suspense>
  );
}
