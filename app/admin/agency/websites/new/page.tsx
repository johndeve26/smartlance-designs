import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { ManagedWebsiteCreateForm } from "@/components/admin/agency/ManagedWebsiteCreateForm";
import { AdminDetailHeader } from "@/components/admin/patterns/AdminDetailHeader";

export const dynamic = "force-dynamic";

export default async function AgencyWebsitesNewPage() {
  await requireAdminUser("manage_websites");

  const [companies, projects, contacts] = await Promise.all([
    prisma.crmCompany.findMany({ orderBy: { name: "asc" }, take: 100, select: { id: true, name: true } }),
    prisma.agencyProject.findMany({
      orderBy: { updatedAt: "desc" },
      take: 100,
      select: { id: true, name: true, projectNumber: true },
    }),
    prisma.crmContact.findMany({
      orderBy: { displayName: "asc" },
      take: 200,
      select: { id: true, displayName: true, firstName: true, lastName: true, email: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <Link href="/admin/agency/websites" className="text-sm text-muted hover:underline">
        ← Websites
      </Link>

      <AdminDetailHeader
        title="New managed website"
        subtitle="Explicitly associate a client website for ongoing care."
      />

      <ManagedWebsiteCreateForm
        companies={companies}
        projects={projects}
        contacts={contacts.map((c) => ({
          id: c.id,
          label: c.displayName ?? [c.firstName, c.lastName].filter(Boolean).join(" ") ?? c.email ?? c.id,
        }))}
      />
    </div>
  );
}
