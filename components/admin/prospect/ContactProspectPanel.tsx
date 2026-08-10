import Link from "next/link";
import { listRequestsForContact } from "@/lib/prospect/requests/service";
import { prisma } from "@/lib/db";
import { AdminProspectRequestPanel } from "@/components/admin/prospect/AdminProspectRequestPanel";

export async function ContactProspectPanel({ contactId }: { contactId: string }) {
  const [requests, reviews, briefs] = await Promise.all([
    listRequestsForContact(contactId),
    prisma.agencyWebsiteReview.findMany({
      where: { portalUser: { contactId } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        normalizedDomain: true,
        status: true,
        completedAt: true,
      },
    }),
    prisma.agencyWebsiteBrief.findMany({
      where: { portalUser: { contactId } },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, title: true, status: true, completionPercent: true },
    }),
  ]);

  if (requests.length === 0 && reviews.length === 0 && briefs.length === 0) {
    return null;
  }

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5">
      <h2 className="text-lg font-semibold">Prospect workspace</h2>
      {reviews.length > 0 ? (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-neutral-600">Website reviews</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {reviews.map((r) => (
              <li key={r.id}>
                {r.normalizedDomain} — {r.status}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {briefs.length > 0 ? (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-neutral-600">Project briefs</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {briefs.map((b) => (
              <li key={b.id}>
                {b.title} — {b.completionPercent}% ({b.status})
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {requests.length > 0 ? (
        <div className="mt-4 space-y-4">
          <h3 className="text-sm font-medium text-neutral-600">Project requests</h3>
          {requests.map((req) => (
            <AdminProspectRequestPanel key={req.id} request={req} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
