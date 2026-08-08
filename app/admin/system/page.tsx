import { requireAdminUser } from "@/lib/admin/session";
import { getSystemStatus } from "@/lib/ops/system-status";

export const dynamic = "force-dynamic";

export default async function AdminSystemPage() {
  await requireAdminUser("view_system");
  const status = await getSystemStatus();

  const rows: Array<{ label: string; value: string }> = [
    { label: "Environment", value: status.environment },
    { label: "Database", value: status.database.label },
    { label: "Media storage", value: status.mediaStorage.label },
    { label: "Email delivery", value: status.emailDelivery.label },
    { label: "Contact form", value: status.contactForm.label },
    { label: "Contact persistence", value: status.enquiryPersistence.label },
    { label: "Contact notification", value: status.contactNotification.label },
    { label: "Free review form", value: status.freeReviewForm.label },
    { label: "Review persistence", value: status.enquiryPersistence.label },
    { label: "Review notification", value: status.reviewNotification.label },
    {
      label: "Notification failures (24h)",
      value: status.notificationFailures24h.label,
    },
    {
      label: "Canonical host",
      value: status.canonicalHost.value
        ? `${status.canonicalHost.label} (${status.canonicalHost.value})`
        : status.canonicalHost.label,
    },
    { label: "Analytics", value: status.analytics.label },
    { label: "Admin bootstrap", value: status.adminBootstrap.label },
    { label: "Content migration", value: status.contentMigration.label },
    {
      label: "Redirect engine",
      value:
        status.redirectEngine.count != null
          ? `${status.redirectEngine.label} (${status.redirectEngine.count} redirects)`
          : status.redirectEngine.label,
    },
    { label: "Public pricing", value: status.publicPricing.label },
    { label: "AI Provider", value: status.aiProvider.label },
    { label: "Research Provider", value: status.researchProvider.label },
    { label: "Discovery News", value: status.discoveryNews.label },
    { label: "Discovery Trends", value: status.discoveryTrends.label },
    { label: "Discovery RSS", value: status.discoveryRss.label },
    { label: "Industry Packs", value: status.discoveryPacks.label },
    { label: "AI pending jobs", value: status.aiPendingJobs.label },
    { label: "AI last success", value: status.aiLastSuccess.label },
    { label: "AI last failure", value: status.aiLastFailure.label },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">System</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Operational configuration status. Secrets are never displayed — only
          configured / not configured labels.
        </p>
      </div>
      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">Check</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b">
                <td className="px-4 py-3 font-medium">{row.label}</td>
                <td className="px-4 py-3">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
