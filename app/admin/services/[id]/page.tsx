import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createPreviewToken } from "@/lib/admin/crypto";
import { requireAdminUser, userCan } from "@/lib/admin/session";
import { getServiceByIdAdmin } from "@/lib/repositories/servicesRepository";
import {
  changeServiceSlugAction,
  publishServiceAction,
  saveServiceDraftAction,
  unpublishServiceAction,
} from "@/lib/admin/content-actions";
import { PublishBar } from "@/components/admin/PublishBar";
import { ServiceFormFields } from "@/components/admin/ServiceFormFields";
import { ServiceAiPanel } from "@/components/admin/content-assistants/AiPanels";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit service",
};

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    saved?: string;
    published?: string;
    unpublished?: string;
    slug?: string;
    opportunityId?: string;
    aiAction?: string;
  }>;
};

export default async function AdminServiceEditPage({
  params,
  searchParams,
}: PageProps) {
  const user = await requireAdminUser();
  const { id } = await params;
  const sp = await searchParams;
  const service = await getServiceByIdAdmin(id);
  if (!service) notFound();

  const canEdit = userCan(user, "edit_draft");
  const canPublish = userCan(user, "publish");
  const canSlug = userCan(user, "slug_redirect");
  const canPreview = userCan(user, "preview");

  const previewHref = canPreview
    ? `/admin/preview/service/${service.id}?preview=${encodeURIComponent(
        createPreviewToken("Service", service.id),
      )}`
    : undefined;

  let message: string | null = null;
  if (sp.saved) message = "Draft saved.";
  if (sp.published) message = "Published.";
  if (sp.unpublished) message = "Unpublished.";
  if (sp.slug) message = "Slug updated.";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="admin-page-title">{service.title}</h1>
        <p className="mt-1 font-mono text-xs text-neutral-500">
          {service.slug} · {service.id}
        </p>
        <p className="mt-2 text-sm text-neutral-600">
          Use Service AI first to generate proposals, then edit CMS fields below
          when you are ready to save draft changes.
        </p>
      </div>

      <ServiceAiPanel
        serviceId={service.id}
        user={user}
        status={service.status}
        opportunityId={sp.opportunityId}
        initialAction={sp.aiAction || "improve"}
        scrollOnMount={Boolean(sp.aiAction || sp.opportunityId)}
      />

      <div>
        <h2 className="text-sm font-semibold text-neutral-900">CMS fields</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Manual edits for catalogue, copy, process, FAQs, relations, and SEO.
        </p>
        <form className="mt-3 space-y-4">
          <input type="hidden" name="id" value={service.id} />

          <PublishBar
            status={service.status}
            canEdit={canEdit}
            canPublish={canPublish}
            canSlug={canSlug}
            previewHref={previewHref}
            saveAction={saveServiceDraftAction}
            publishAction={publishServiceAction}
            unpublishAction={unpublishServiceAction}
            slugAction={changeServiceSlugAction}
            currentSlug={service.slug}
            message={message}
          />

          <ServiceFormFields
            key={`${service.id}-${service.updatedAt.toISOString()}`}
            service={service}
            disabled={!canEdit}
            slugReadOnly
            enableFieldAi
          />
        </form>
      </div>
    </div>
  );
}
