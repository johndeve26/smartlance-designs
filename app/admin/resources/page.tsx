import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { countResourcesByType } from "@/lib/repositories/resourcesRepository";
import { countInsightsByStatus } from "@/lib/repositories/insightsRepository";

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
      <div>
        <h1 className="text-2xl font-semibold">Resources</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Guides, Comparisons, Checklists, Glossary, Templates and Tools.
          Insights stay under Insights (single source of truth).
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/insights"
          className="rounded-lg border border-neutral-200 bg-white p-4 hover:border-[#F47A48]"
        >
          <div className="text-lg font-semibold">Insights</div>
          <div className="mt-2 text-sm text-neutral-600">
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
              className="rounded-lg border border-neutral-200 bg-white p-4 hover:border-[#F47A48]"
            >
              <div className="text-lg font-semibold">{item.label}</div>
              <div className="mt-2 text-sm text-neutral-600">
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
