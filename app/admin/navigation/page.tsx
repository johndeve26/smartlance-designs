import { requireAdminUser } from "@/lib/admin/session";
import {
  listNavigationMenus,
  navigationMenuLabel,
  validateNavigationItems,
  type NavDraftItem,
} from "@/lib/repositories/navigationRepository";
import { NavigationEditor } from "@/components/admin/NavigationEditor";
import { PageHeader } from "@/components/ui/page-header";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";
import type { NavigationMenuKey } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminNavigationPage({
  searchParams,
}: {
  searchParams: Promise<{ menu?: string }>;
}) {
  await requireAdminUser("manage_navigation");
  const sp = await searchParams;
  const menus = await listNavigationMenus();
  const menuKey = (sp.menu || menus[0]?.menuKey || "HEADER_PRIMARY") as NavigationMenuKey;
  const current = menus.find((m) => m.menuKey === menuKey) || menus[0];
  const draft = (current?.draftItems as NavDraftItem[]) || [];
  const issues = current ? await validateNavigationItems(draft) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Navigation"
        description="Manage approved header, CTA and footer locations. Public design stays code-controlled."
      />

      <div className="flex flex-wrap gap-2">
        {menus.map((m) => (
          <a
            key={m.menuKey}
            href={`/admin/navigation?menu=${m.menuKey}`}
            className={`rounded-full px-3 py-1 text-sm ${
              m.menuKey === menuKey
                ? "bg-foreground text-background"
                : "border border-border bg-surface hover:bg-surface-muted/50"
            }`}
          >
            {navigationMenuLabel(m.menuKey)}
            <span className="ml-1 text-xs opacity-70">{m.status}</span>
          </a>
        ))}
      </div>

      {!menus.length ? (
        <AdminPanel className="border-warning bg-warning-soft/40">
          <p className="text-sm text-warning-text">
            No navigation menus yet. Run{" "}
            <code>npm run content:import:phase4</code> to import current public
            navigation.
          </p>
        </AdminPanel>
      ) : current ? (
        <NavigationEditor
          menuKey={current.menuKey}
          label={navigationMenuLabel(current.menuKey)}
          initialItems={draft}
          initialIssues={issues}
        />
      ) : null}
    </div>
  );
}
