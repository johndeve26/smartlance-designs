import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { listContacts } from "@/lib/crm/contacts";
import { contactDisplayName } from "@/lib/crm/normalize";
import {
  CRM_LIFECYCLE_LABELS,
  CRM_LEAD_STATUS_LABELS,
  CRM_LEAD_TEMPERATURE_LABELS,
  formatDate,
} from "@/lib/crm/display";
import { CrmPagination } from "@/components/admin/crm/CrmPagination";
import { CrmExportButton } from "@/components/admin/crm/CrmExportButton";
import { ContactListFilters } from "@/components/admin/crm/ContactListFilters";
import {
  ContactsBulkTable,
  type ContactBulkRow,
} from "@/components/admin/crm/ContactsBulkTable";
import { listContactViewsAction, getContactViewAction } from "@/lib/admin/crm-view-actions";
import {
  CONTACT_FILTER_VERSION,
  parseContactFilterV3,
  type ContactFilterV3,
} from "@/lib/crm/filters/contact-filter-schema";
import {
  decodeContactFilterParam,
  quickConditionsFromSearchParams,
} from "@/lib/crm/filters/filter-serialize";
import type {
  CrmContactLifecycleStage,
  CrmContactSource,
  CrmContactEmailStatus,
  CrmLeadStatus,
  CrmLeadTemperature,
} from "@prisma/client";
import { AdminListPage } from "@/components/admin/patterns/AdminListPage";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

function buildListFilter(
  sp: Record<string, string | undefined>,
  viewFilter: ContactFilterV3 | null,
): { advancedFilter?: ContactFilterV3; useQuickParams: boolean } {
  if (sp.f) {
    const decoded = decodeContactFilterParam(sp.f);
    if (decoded) return { advancedFilter: decoded, useQuickParams: false };
  }

  const quick = quickConditionsFromSearchParams(sp);
  const legacy: ContactFilterV3["conditions"] = [];
  if (sp.jobTitleContains) {
    legacy.push({ kind: "STANDARD", field: "jobTitle", operator: "CONTAINS", value: sp.jobTitleContains });
  }
  if (sp.hasLinkedIn === "1") {
    legacy.push({ kind: "SOCIAL", platform: "LINKEDIN", operator: "HAS" });
  }

  const conditions = [...(viewFilter?.conditions ?? []), ...quick, ...legacy];
  if (!conditions.length) return { useQuickParams: true };

  return {
    advancedFilter: {
      version: CONTACT_FILTER_VERSION,
      match: viewFilter?.match ?? "ALL",
      conditions,
    },
    useQuickParams: false,
  };
}

export default async function CrmContactsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireAdminUser("view_crm");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || "1") || 1);
  const canManage = can(user.role, "manage_crm");

  const views = await listContactViewsAction();
  const view = sp.view ? await getContactViewAction(sp.view) : null;
  const viewFilter = view ? parseContactFilterV3(view.filterJson) : null;
  const { advancedFilter, useQuickParams } = buildListFilter(sp, viewFilter);
  const builderInitialFilter = sp.f
    ? decodeContactFilterParam(sp.f)
    : viewFilter;

  const list = await listContacts({
    q: sp.q,
    lifecycle: useQuickParams ? (sp.lifecycle as CrmContactLifecycleStage | undefined) : undefined,
    leadStatus: useQuickParams ? (sp.leadStatus as CrmLeadStatus | undefined) : undefined,
    temperature: useQuickParams ? (sp.temperature as CrmLeadTemperature | undefined) : undefined,
    source: useQuickParams ? (sp.source as CrmContactSource | undefined) : undefined,
    emailStatus: useQuickParams ? (sp.emailStatus as CrmContactEmailStatus | undefined) : undefined,
    countryCode: useQuickParams ? sp.countryCode : undefined,
    companyId: sp.companyId,
    hasOpenTask: sp.hasOpenTask === "1",
    overdueFollowUp: sp.overdue === "1",
    advancedFilter,
    page,
    pageSize: 25,
  });

  const totalPages = Math.max(1, Math.ceil(list.total / list.pageSize));

  const rows: ContactBulkRow[] = list.items.map((c) => {
    const lead = c.leads[0];
    return {
      id: c.id,
      name: contactDisplayName(c),
      company: c.company?.name ?? "—",
      country: c.countryName ?? c.countryCode ?? "—",
      email: c.email ?? "—",
      lifecycle: c.lifecycleStage,
      lifecycleLabel: CRM_LIFECYCLE_LABELS[c.lifecycleStage],
      leadStatus: lead ? CRM_LEAD_STATUS_LABELS[lead.status] : "—",
      temperature: lead?.temperature ?? null,
      temperatureLabel: lead ? CRM_LEAD_TEMPERATURE_LABELS[lead.temperature] : null,
      nextAction: formatDate(c.nextActivityAt) ?? "—",
    };
  });

  return (
    <AdminListPage
      title="Contacts"
      description={
        <>
          Search, filter, and save views.{" "}
          <Link href="/admin/crm/settings/properties" className="text-accent-text hover:underline">
            Manage properties
          </Link>
        </>
      }
      action={
        <div className="flex flex-wrap gap-2">
          {can(user.role, "export_crm") ? (
            <CrmExportButton type="contacts" label="Export CSV" />
          ) : null}
          {canManage ? (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/crm/contacts/import">Import CSV</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/admin/crm/contacts/new">New contact</Link>
              </Button>
            </>
          ) : null}
        </div>
      }
      filters={
        <ContactListFilters
          views={views}
          currentViewId={sp.view}
          initialAdvancedFilter={builderInitialFilter}
        />
      }
      isEmpty={list.items.length === 0}
      empty={{ title: "No contacts found", description: "Try adjusting filters or create a new contact." }}
      pagination={
        <CrmPagination
          page={list.page}
          totalPages={totalPages}
          total={list.total}
          hrefForPage={(p) => `/admin/crm/contacts?${buildQs(sp, p)}`}
        />
      }
    >
      <ContactsBulkTable rows={rows} canManage={canManage} />
    </AdminListPage>
  );
}

function buildQs(sp: Record<string, string | undefined>, page: number) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (v && k !== "page") params.set(k, v);
  }
  params.set("page", String(page));
  return params.toString();
}
