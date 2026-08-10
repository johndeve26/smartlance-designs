import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/session";
import { getTemplateById } from "@/lib/agency/templates";
import { TemplateEditor } from "@/components/admin/agency/TemplateEditor";
import { AdminDetailHeader } from "@/components/admin/patterns/AdminDetailHeader";

export const dynamic = "force-dynamic";

export default async function AgencyTemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminUser("manage_project_templates");
  const { id } = await params;
  const template = await getTemplateById(id);
  if (!template) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/agency/templates" className="text-sm text-muted hover:underline">
        ← Templates
      </Link>

      <AdminDetailHeader title={template.name} subtitle={template.description ?? undefined} />

      <TemplateEditor
        template={{
          id: template.id,
          name: template.name,
          description: template.description ?? undefined,
          serviceType: template.serviceType,
          milestones: template.milestones.map((m) => ({
            title: m.title,
            description: m.description ?? undefined,
            position: m.position,
            offsetDaysStart: m.offsetDaysStart ?? undefined,
            offsetDaysDue: m.offsetDaysDue ?? undefined,
            clientVisible: m.clientVisible,
            tasks: m.tasks.map((t) => ({
              title: t.title,
              description: t.description ?? undefined,
              position: t.position,
              priority: t.priority,
              offsetDaysDue: t.offsetDaysDue ?? undefined,
              clientVisible: t.clientVisible,
            })),
          })),
          requirements: template.requirements.map((r) => ({
            title: r.title,
            description: r.description ?? undefined,
            type: r.type,
            offsetDaysDue: r.offsetDaysDue ?? undefined,
            clientVisible: r.clientVisible,
          })),
        }}
      />
    </div>
  );
}
