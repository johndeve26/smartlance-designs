import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/session";
import { getManagedWebsiteForAdmin } from "@/lib/client-success/websites";
import { MANAGED_WEBSITE_STATUS, WEBSITE_CARE_STATUS, CARE_EVENT_TYPE } from "@/lib/client-success/constants";
import { AdminCareEventForm, AdminWebsiteAccessPanel } from "@/components/admin/agency/AdminWebsitePanels";
import { prisma } from "@/lib/db";
import { AdminDetailHeader } from "@/components/admin/patterns/AdminDetailHeader";
import { AdminSection, AdminPanel } from "@/components/admin/patterns/AdminPanel";

export const dynamic = "force-dynamic";

export default async function AgencyWebsiteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminUser("view_websites");
  const { id } = await params;

  let website;
  try {
    website = await getManagedWebsiteForAdmin(id);
  } catch {
    notFound();
  }

  const contacts = await prisma.crmContact.findMany({
    where: website.companyId ? { companyId: website.companyId } : undefined,
    orderBy: { displayName: "asc" },
    take: 100,
    select: { id: true, displayName: true, firstName: true, lastName: true, email: true },
  });

  return (
    <div className="space-y-6">
      <Link href="/admin/agency/websites" className="text-sm text-muted hover:underline">
        ← Websites
      </Link>

      <AdminDetailHeader title={website.name} subtitle={website.domain} />

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminPanel className="space-y-2 text-sm">
          <h2 className="font-semibold">Details</h2>
          <p>Status: {MANAGED_WEBSITE_STATUS[website.status] ?? website.status}</p>
          <p>Care: {WEBSITE_CARE_STATUS[website.careStatus] ?? website.careStatus}</p>
          {website.carePlanName ? <p>Plan: {website.carePlanName}</p> : null}
          {website.primaryProject ? (
            <p>
              Project:{" "}
              <Link href={`/admin/agency/projects/${website.primaryProject.id}`} className="text-accent-text hover:underline">
                {website.primaryProject.projectNumber}
              </Link>
            </p>
          ) : null}
        </AdminPanel>

        <AdminPanel>
          <h2 className="mb-3 font-semibold">Client access</h2>
          <AdminWebsiteAccessPanel
            websiteId={website.id}
            access={website.clientAccess.map((a) => ({
              contactId: a.contactId,
              name: a.contact.displayName ?? a.contact.firstName ?? "Contact",
              email: a.contact.email ?? "",
              role: a.role,
            }))}
            contacts={contacts.map((c) => ({
              id: c.id,
              label: c.displayName ?? [c.firstName, c.lastName].filter(Boolean).join(" ") ?? c.email ?? c.id,
            }))}
          />
        </AdminPanel>
      </div>

      <AdminSection title="Care events">
        <AdminPanel>
          <ul className="space-y-2 text-sm">
            {website.careEvents.map((e) => (
              <li key={e.id} className="border-b border-border pb-2">
                <p className="font-medium">{e.title}</p>
                <p className="text-muted">
                  {CARE_EVENT_TYPE[e.type] ?? e.type} · {e.status}
                </p>
                {e.clientSummary ? <p>{e.clientSummary}</p> : null}
                {e.internalNotes ? <p className="italic text-muted">Internal: {e.internalNotes}</p> : null}
              </li>
            ))}
          </ul>
          <AdminCareEventForm websiteId={website.id} />
        </AdminPanel>
      </AdminSection>
    </div>
  );
}
