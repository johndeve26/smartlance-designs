import type { Metadata } from "next";
import { ProspectShell } from "@/components/prospect/ProspectShell";
import { getPortalUser } from "@/lib/portal/session";
import { listAccessibleProjectIds } from "@/lib/portal/access";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getPortalUser();
  const projectIds = user ? await listAccessibleProjectIds(user.id).catch(() => []) : [];

  return (
    <ProspectShell hasClientAccess={projectIds.length > 0}>{children}</ProspectShell>
  );
}
