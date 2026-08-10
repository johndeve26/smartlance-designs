import { redirect } from "next/navigation";
import { getPortalUser } from "@/lib/portal/session";
import { getProspectAccount } from "@/lib/prospect/workspace/home";
import { ProspectAccountForm } from "@/components/prospect/ProspectAccountForm";

export default async function WorkspaceAccountPage() {
  const user = await getPortalUser();
  if (!user) redirect("/workspace/login");

  const account = await getProspectAccount(user.id);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">Account</h1>
      <ProspectAccountForm account={account} />
      <p className="text-sm text-neutral-500">
        Email: {account.email} (used for sign-in)
      </p>
      <a href="/portal/logout" className="text-sm text-[#F47A48] hover:underline">
        Sign out
      </a>
    </div>
  );
}
