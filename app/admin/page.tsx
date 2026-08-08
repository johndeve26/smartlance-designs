import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { countInsightsByStatus } from "@/lib/repositories/insightsRepository";
import { countWorkByStatus } from "@/lib/repositories/workRepository";
import { countServicesByStatus } from "@/lib/repositories/servicesRepository";
import { listAuditLogs } from "@/lib/repositories/auditRepository";
import { hasDatabaseUrl } from "@/lib/db";
import { countMediaByStatus } from "@/lib/repositories/mediaRepository";
import { getSystemStatus } from "@/lib/ops/system-status";
import {
  countNewEnquiries,
  countNotificationFailures,
  listEnquiries,
} from "@/lib/enquiries/service";
import { formDeliveryConfigured } from "@/lib/forms";
import { getPublicSettings } from "@/lib/repositories/siteSettingsRepository";
import { getAIWriterDashboard } from "@/lib/ai/editorial-service";
import { runContentQualityAudit } from "@/lib/ops/content-quality-audit";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await requireAdminUser("dashboard");

  if (!hasDatabaseUrl()) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-2 text-sm text-neutral-600">
          DATABASE_URL is not configured.
        </p>
      </div>
    );
  }

  const canViewEnquiries = can(user.role, "view_enquiries");
  const canUseAiWriter = can(user.role, "use_ai_writer");
  const canManageAiSettings = can(user.role, "manage_ai_settings");
  const canEditDraft = can(user.role, "edit_draft");
  const canRunLinkHealth = can(user.role, "run_link_health");

  const [
    services,
    work,
    insights,
    audit,
    media,
    system,
    newEnquiries,
    deliveryFailures,
    settings,
    recentEnquiries,
    aiDash,
    contentAudit,
    emailDeliveryConfigured,
  ] = await Promise.all([
    countServicesByStatus(),
    countWorkByStatus(),
    countInsightsByStatus(),
    listAuditLogs({ limit: 12 }),
    countMediaByStatus(),
    getSystemStatus(),
    canViewEnquiries
      ? countNewEnquiries()
      : Promise.resolve({ contact: 0, review: 0, total: 0 }),
    canViewEnquiries ? countNotificationFailures(24) : Promise.resolve(0),
    getPublicSettings(),
    canViewEnquiries
      ? listEnquiries({ pageSize: 5, includeSpam: false })
      : Promise.resolve({ items: [], total: 0, page: 1, pageSize: 5 }),
    canUseAiWriter ? getAIWriterDashboard() : Promise.resolve(null),
    canEditDraft ? runContentQualityAudit() : Promise.resolve(null),
    formDeliveryConfigured(),
  ]);

  const cards = [
    { label: "Services published", value: services.PUBLISHED },
    { label: "Work published", value: work.PUBLISHED },
    { label: "Insights published", value: insights.PUBLISHED },
    { label: "Media assets", value: media.total },
    ...(canViewEnquiries
      ? [
          { label: "New contact enquiries", value: newEnquiries.contact },
          { label: "New review requests", value: newEnquiries.review },
          { label: "Delivery failures (24h)", value: deliveryFailures },
        ]
      : []),
    ...(canUseAiWriter && aiDash
      ? [
          { label: "AI needs review", value: aiDash.needsReview },
          { label: "AI drafting", value: aiDash.drafting },
        ]
      : []),
    ...(canEditDraft && contentAudit
      ? [
          {
            label: "Content audit — high priority",
            value: contentAudit.summary.highPriority,
          },
        ]
      : []),
    { label: "Environment", value: system.environment },
  ];

  const aiLinks = [
    ...(canUseAiWriter
      ? ([
          ["/admin/ai-writer", "AI Editorial Studio"],
          ["/admin/ai-writer/discover", "Topic discovery"],
          ["/admin/ai-writer/new", "New AI project"],
        ] as const)
      : []),
    ...(canManageAiSettings
      ? ([["/admin/ai-writer/settings", "AI Writer settings"]] as const)
      : []),
    ...(canEditDraft
      ? ([["/admin/content-audit", "Content quality audit"]] as const)
      : []),
  ];

  const operationsLinks = [
    ...(canViewEnquiries ? ([["/admin/enquiries", "Enquiries"]] as const) : []),
    ["/admin/media", "Media library"],
    ["/admin/navigation", "Navigation"],
    ["/admin/seo", "SEO health"],
    ...(canRunLinkHealth ? ([["/admin/link-health", "Link health"]] as const) : []),
    ["/admin/settings", "Site settings"],
    ["/admin/system", "System status"],
  ] as const;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Content, operations, and enquiry overview.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-neutral-200 bg-white p-4"
          >
            <div className="text-2xl font-semibold text-neutral-900">
              {card.value}
            </div>
            <div className="mt-1 text-xs font-medium uppercase tracking-wide text-neutral-500">
              {card.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {aiLinks.length > 0 ? (
          <section className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              AI &amp; content
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {aiLinks.map(([href, label]) => (
                <li key={href}>
                  <Link className="text-[#F47A48] hover:underline" href={href}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            {canUseAiWriter && aiDash ? (
              <p className="mt-4 text-xs text-neutral-500">
                AI provider: {aiDash.provider.label}. Research:{" "}
                {aiDash.research.label}.
                {aiDash.failedRuns > 0
                  ? ` ${aiDash.failedRuns} failed run(s) in the last 7 days.`
                  : null}
              </p>
            ) : null}
          </section>
        ) : null}

        <section className="rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Operations
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {operationsLinks.map(([href, label]) => (
              <li key={href}>
                <Link className="text-[#F47A48] hover:underline" href={href}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-neutral-500">
            Contact form: {settings.contactFormEnabled ? "Enabled" : "Disabled"}
            . Review form:{" "}
            {settings.freeReviewFormEnabled ? "Enabled" : "Disabled"}. Email
            notification:{" "}
            {emailDeliveryConfigured ? "Configured" : "Not configured"}.
          </p>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-4 xl:col-span-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            {canViewEnquiries ? "Recent enquiries" : "Recent activity"}
          </h2>
          {canViewEnquiries ? (
            <ul className="mt-3 space-y-2 text-sm">
              {recentEnquiries.items.map((item) => (
                <li key={item.id} className="border-b border-neutral-100 pb-2">
                  <Link
                    href={
                      item.type === "CONTACT"
                        ? `/admin/enquiries/contact/${item.id}`
                        : `/admin/enquiries/reviews/${item.id}`
                    }
                    className="font-medium text-[#F47A48] hover:underline"
                  >
                    {item.reference}
                  </Link>
                  <div className="text-xs text-neutral-500">
                    {item.name || "—"} · {item.status} ·{" "}
                    {item.submittedAt.toISOString().slice(0, 10)}
                  </div>
                </li>
              ))}
              {!recentEnquiries.items.length ? (
                <li className="text-neutral-500">No new enquiries.</li>
              ) : null}
            </ul>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {audit.items.map((item) => (
                <li key={item.id} className="border-b border-neutral-100 pb-2">
                  <div className="font-medium text-neutral-900">{item.action}</div>
                  <div className="text-xs text-neutral-500">
                    {item.entityType} ·{" "}
                    {item.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
