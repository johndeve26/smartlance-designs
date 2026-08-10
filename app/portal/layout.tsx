import { getPortalUser } from "@/lib/portal/session";
import { getPortalAttentionCount } from "@/lib/portal/attention";
import { PortalShell } from "@/components/portal/PortalShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await getPortalUser();
  const attentionCount = user ? await getPortalAttentionCount(user.id).catch(() => 0) : 0;

  return <PortalShell attentionCount={attentionCount}>{children}</PortalShell>;
}
