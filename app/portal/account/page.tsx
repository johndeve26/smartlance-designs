import { redirect } from "next/navigation";
import { getPortalUser } from "@/lib/portal/session";
import { getPortalAccount } from "@/lib/portal/account";
import { PortalPageHeader } from "@/components/portal/PortalShell";
import { PortalAccountView } from "@/components/portal/PortalAccount";

export const dynamic = "force-dynamic";

export default async function PortalAccountPage() {
  const user = await getPortalUser();
  if (!user) redirect("/portal/login");

  const account = await getPortalAccount(user.id);

  return (
    <div>
      <PortalPageHeader title="Account" description="Your profile and team access." />
      <PortalAccountView account={account} />
    </div>
  );
}
