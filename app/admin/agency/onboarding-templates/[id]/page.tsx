import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { getOnboardingTemplateById } from "@/lib/onboarding";
import { ONBOARDING_TEMPLATE_STATUS_LABELS } from "@/lib/onboarding/constants";
import { AdminDetailHeader } from "@/components/admin/patterns/AdminDetailHeader";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";

export const dynamic = "force-dynamic";

export default async function OnboardingTemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdminUser("view_onboarding");
  const { id } = await params;
  const template = await getOnboardingTemplateById(id);
  if (!template) notFound();

  const version = template.versions.find((v) => v.id === template.currentVersionId) ?? template.versions[0];

  return (
    <div className="space-y-6">
      <Link href="/admin/agency/onboarding-templates" className="text-sm text-muted hover:underline">
        ← Onboarding templates
      </Link>

      <AdminDetailHeader
        title={template.name}
        subtitle={`${ONBOARDING_TEMPLATE_STATUS_LABELS[template.status]}${version ? ` · V${version.versionNumber}` : ""}`}
      />

      {template.description ? (
        <AdminPanel className="text-sm">{template.description}</AdminPanel>
      ) : null}

      {version ? (
        <AdminPanel>
          <h2 className="font-semibold">Sections</h2>
          <div className="mt-3 space-y-4 text-sm">
            {version.sections.map((section) => (
              <div key={section.id}>
                <h3 className="font-medium">{section.title}</h3>
                <ul className="mt-2 list-disc pl-5 text-muted">
                  {version.questions
                    .filter((q) => q.sectionId === section.id)
                    .map((q) => (
                      <li key={q.id}>
                        {q.label} ({q.type}){q.required ? " *" : ""}
                      </li>
                    ))}
                  {version.requirements
                    .filter((r) => r.sectionId === section.id)
                    .map((r) => (
                      <li key={r.id}>
                        Requirement: {r.title} ({r.type}){r.required ? " *" : ""}
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
          {can(user.role, "manage_onboarding_templates") ? (
            <p className="mt-4 text-xs text-muted">
              Published template versions snapshot into project onboarding. Edits do not mutate active onboarding.
            </p>
          ) : null}
        </AdminPanel>
      ) : null}
    </div>
  );
}
