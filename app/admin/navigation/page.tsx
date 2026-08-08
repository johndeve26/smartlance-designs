import { requireAdminUser } from "@/lib/admin/session";
import {
  listNavigationMenus,
  navigationMenuLabel,
  validateNavigationItems,
  type NavDraftItem,
} from "@/lib/repositories/navigationRepository";
import { NavigationEditor } from "@/components/admin/NavigationEditor";
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
      <div>
        <h1 className="text-2xl font-semibold">Navigation</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Manage approved header, CTA and footer locations. Public design stays
          code-controlled.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {menus.map((m) => (
          <a
            key={m.menuKey}
            href={`/admin/navigation?menu=${m.menuKey}`}
            className={`rounded-full px-3 py-1 text-sm ${
              m.menuKey === menuKey
                ? "bg-neutral-900 text-white"
                : "border border-neutral-300 bg-white"
            }`}
          >
            {navigationMenuLabel(m.menuKey)}
            <span className="ml-1 text-xs opacity-70">{m.status}</span>
          </a>
        ))}
      </div>

      {!menus.length ? (
        <p className="rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          No navigation menus yet. Run{" "}
          <code>npm run content:import:phase4</code> to import current public
          navigation.
        </p>
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
