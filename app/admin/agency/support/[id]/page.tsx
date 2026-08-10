import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/session";
import { getSupportRequestForAdmin } from "@/lib/client-success/support";
import { SUPPORT_STATUS, SUPPORT_CATEGORY, SUPPORT_PRIORITY } from "@/lib/client-success/constants";
import { AdminSupportReplyPanel, AdminSupportLinkChangeForm } from "@/components/admin/agency/AdminSupportPanels";
import { AdminDetailHeader } from "@/components/admin/patterns/AdminDetailHeader";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";
import { SemanticBadge } from "@/components/ui/status-badge";

export const dynamic = "force-dynamic";

export default async function AgencySupportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminUser("view_support");
  const { id } = await params;

  let sr;
  try {
    sr = await getSupportRequestForAdmin(id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/agency/support" className="text-sm text-muted hover:underline">
        ← Support
      </Link>

      <AdminDetailHeader
        title={`${sr.supportNumber} — ${sr.subject}`}
        subtitle={`${sr.website.name} (${sr.website.domain}) · ${SUPPORT_STATUS[sr.status]}`}
        secondaryActions={
          <SemanticBadge tone={sr.status === "WAITING_ON_CLIENT" ? "warning" : "neutral"}>
            {SUPPORT_STATUS[sr.status]}
          </SemanticBadge>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminPanel className="space-y-2 text-sm">
          <p>Category: {SUPPORT_CATEGORY[sr.category]}</p>
          <p>Priority: {SUPPORT_PRIORITY[sr.priority]}</p>
          <p>Waiting on: {sr.waitingOn}</p>
          <div className="mt-3 whitespace-pre-wrap">{sr.description}</div>
        </AdminPanel>

        <div className="space-y-4">
          <AdminSupportReplyPanel supportRequestId={sr.id} />
          <AdminSupportLinkChangeForm supportRequestId={sr.id} />
        </div>
      </div>

      <AdminPanel>
        <h2 className="mb-3 font-semibold">Conversation</h2>
        <ul className="space-y-3 text-sm">
          {sr.messages.map((m) => (
            <li key={m.id} className={`rounded border border-border p-3 ${m.clientVisible ? "" : "opacity-60"}`}>
              <p className="text-xs text-muted">
                {m.authorType} · {m.createdAt.toLocaleString()}
                {!m.clientVisible ? " · internal" : ""}
              </p>
              <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
            </li>
          ))}
        </ul>
      </AdminPanel>
    </div>
  );
}
