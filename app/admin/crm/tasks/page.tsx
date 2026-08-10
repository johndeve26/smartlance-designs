import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { listTasks } from "@/lib/crm/tasks";
import { contactDisplayName } from "@/lib/crm/normalize";
import { formatDate } from "@/lib/ui/format";
import { CrmPagination } from "@/components/admin/crm/CrmPagination";
import { TaskCompleteButton } from "@/components/admin/crm/TaskCompleteButton";
import { AdminListPage } from "@/components/admin/patterns/AdminListPage";
import { DataTable } from "@/components/ui/data-table";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const views = [
  { id: "overdue", label: "Overdue" },
  { id: "today", label: "Today" },
  { id: "upcoming", label: "Upcoming" },
  { id: "completed", label: "Completed" },
  { id: "all", label: "All open" },
] as const;

export default async function CrmTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; page?: string }>;
}) {
  await requireAdminUser("view_crm");
  const sp = await searchParams;
  const view = (views.find((v) => v.id === sp.view)?.id ?? "overdue") as
    | "today"
    | "upcoming"
    | "overdue"
    | "completed"
    | "all";
  const page = Math.max(1, Number(sp.page || "1") || 1);

  const list = await listTasks({ view, page });
  const totalPages = Math.max(1, Math.ceil(list.total / list.pageSize));

  return (
    <AdminListPage
      title="Tasks"
      description="Follow-ups and action items."
      filters={
        <div className="flex flex-wrap gap-2">
          {views.map((v) => (
            <Link
              key={v.id}
              href={`/admin/crm/tasks?view=${v.id}`}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                view === v.id
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-surface hover:bg-surface-muted/50",
              )}
            >
              {v.label}
            </Link>
          ))}
        </div>
      }
      isEmpty={list.items.length === 0}
      empty={{ title: "No tasks in this view" }}
      pagination={
        <CrmPagination
          page={list.page}
          totalPages={totalPages}
          total={list.total}
          hrefForPage={(p) => `/admin/crm/tasks?view=${view}&page=${p}`}
        />
      }
    >
      <DataTable
        rows={list.items}
        rowKey={(t) => t.id}
        columns={[
          {
            key: "title",
            header: "Task",
            cell: (t) => (
              <div>
                <p className="font-medium">{t.title}</p>
                {t.contact ? (
                  <Link
                    href={`/admin/crm/contacts/${t.contact.id}`}
                    className="text-accent-text hover:underline"
                  >
                    {contactDisplayName(t.contact)}
                  </Link>
                ) : null}
              </div>
            ),
          },
          {
            key: "due",
            header: "Due",
            cell: (t) => formatDate(t.dueAt) ?? "—",
          },
          {
            key: "action",
            header: "",
            cell: (t) => (t.status === "OPEN" ? <TaskCompleteButton taskId={t.id} /> : null),
          },
        ]}
      />
    </AdminListPage>
  );
}
