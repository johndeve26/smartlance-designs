import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { countResourcesByType } from "@/lib/repositories/resourcesRepository";
import { countInsightsByStatus } from "@/lib/repositories/insightsRepository";
import { PageHeader } from "@/components/ui/page-header";

export const dynamic = "force-dynamic";

const TYPES = [
  { type: "guides", label: "Guides", kind: "guide" as const },
  { type: "comparisons", label: "Comparisons", kind: "comparison" as const },
  { type: "checklists", label: "Checklists", kind: "checklist" as const },
  { type: "glossary", label: "Glossary", kind: "glossary" as const },
  { type: "templates", label: "Templates", kind: "template" as const },
  { type: "tools", label: "Tools", kind: "tool" as const },
];

export default async function AdminResourcesPage() {
  await requireAdminUser("edit_draft");
  const [byType, insights] = await Promise.all([
    countResourcesByType(),
    countInsightsByStatus(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resources"
        description="Guides, Comparisons, Checklists, Glossary, Templates and Tools. Insights stay under Insights (single source of truth)."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/insights"
          className="rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-strong hover:bg-surface-muted/30"
        >
          <div className="text-lg font-semibold text-foreground">Insights</div>
          <div className="mt-2 text-sm text-muted">
            Published {insights.PUBLISHED} · Draft {insights.DRAFT} · Archived{" "}
            {insights.ARCHIVED}
          </div>
        </Link>
        {TYPES.map((item) => {
          const counts = byType[item.kind] ?? {
            DRAFT: 0,
            PUBLISHED: 0,
            ARCHIVED: 0,
          };
          return (
            <Link
              key={item.type}
              href={`/admin/resources/${item.type}`}
              className="rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-strong hover:bg-surface-muted/30"
            >
              <div className="text-lg font-semibold text-foreground">{item.label}</div>
              <div className="mt-2 text-sm text-muted">
                Published {counts.PUBLISHED} · Draft {counts.DRAFT} · Archived{" "}
                {counts.ARCHIVED}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
