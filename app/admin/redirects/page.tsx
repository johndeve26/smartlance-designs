import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { listRedirects, countRedirectsByOrigin } from "@/lib/repositories/redirectsRepository";
import { RedirectsManager } from "@/components/admin/RedirectsManager";
import { PageHeader } from "@/components/ui/page-header";

export const dynamic = "force-dynamic";

export default async function AdminRedirectsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    origin?: string;
    status?: string;
  }>;
}) {
  const user = await requireAdminUser("manage_redirects");
  const sp = await searchParams;
  const origin =
    sp.origin === "SLUG_CHANGE" ||
    sp.origin === "LEGACY_MIGRATION" ||
    sp.origin === "MANUAL"
      ? sp.origin
      : undefined;
  const status =
    sp.status === "ACTIVE" || sp.status === "DISABLED" ? sp.status : undefined;

  const [{ items, total }, byOrigin] = await Promise.all([
    listRedirects({
      q: sp.q,
      origin,
      status,
      limit: 100,
    }),
    countRedirectsByOrigin(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Redirects"
        description={`${total} matching · Legacy: ${byOrigin.LEGACY_MIGRATION ?? 0} · Slug change: ${byOrigin.SLUG_CHANGE ?? 0} · Manual: ${byOrigin.MANUAL ?? 0}`}
      />
      <RedirectsManager
        items={items.map((r) => ({
          id: r.id,
          sourcePath: r.sourcePath,
          destination: r.destination,
          type: r.type,
          status: r.status,
          origin: r.origin,
          reason: r.reason,
          updatedAt: r.updatedAt.toISOString(),
        }))}
        canHardDelete={can(user.role, "settings_critical")}
        filters={{ q: sp.q || "", origin: sp.origin || "", status: sp.status || "" }}
      />
    </div>
  );
}
