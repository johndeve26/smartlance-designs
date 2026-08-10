import Link from "next/link";
import { redirect } from "next/navigation";
import { getPortalUser } from "@/lib/portal/session";
import { listPortalWebsites } from "@/lib/portal/websites";
import { PortalPageHeader, PortalPrimaryButton } from "@/components/portal/PortalShell";
import { PortalWebsiteList } from "@/components/portal/PortalWebsiteCards";

export const dynamic = "force-dynamic";

export default async function PortalWebsitesPage() {
  const user = await getPortalUser();
  if (!user) redirect("/portal/login");

  const websites = await listPortalWebsites(user.id);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <PortalPageHeader
          title="My websites"
          description="Websites Smartlance manages for you."
        />
        {websites.length ? (
          <PortalPrimaryButton href="/portal/support/new">Request support</PortalPrimaryButton>
        ) : null}
      </div>
      <PortalWebsiteList websites={websites} />
      {websites.length ? (
        <p className="mt-4 text-sm text-neutral-600">
          Need help?{" "}
          <Link href="/portal/support" className="text-[#F47A48] hover:underline">
            View support requests
          </Link>
        </p>
      ) : null}
    </div>
  );
}
