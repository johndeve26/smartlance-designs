"use server";

import { revalidatePath } from "next/cache";
import { assertSameOrigin, requireAdminUser } from "@/lib/admin/session";
import {
  createContactView,
  deleteContactView,
  getContactViewById,
  listContactViews,
  updateContactView,
} from "@/lib/crm/views/service";
import { parseContactFilterV3, type ContactFilterV3 } from "@/lib/crm/filters/contact-filter-schema";
import { countContactsMatchingFilter } from "@/lib/crm/filters/contact-filter-query";

export async function listContactViewsAction() {
  const user = await requireAdminUser("view_crm");
  return listContactViews(user.id);
}

export async function getContactViewAction(id: string) {
  const user = await requireAdminUser("view_crm");
  return getContactViewById(id, user.id);
}

export async function saveContactViewAction(input: {
  name: string;
  description?: string;
  filter: ContactFilterV3;
  isShared?: boolean;
}) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");
  const filter = parseContactFilterV3(input.filter);
  const view = await createContactView({
    name: input.name,
    description: input.description,
    filter,
    isShared: input.isShared,
    actorId: user.id,
  });
  revalidatePath("/admin/crm/contacts");
  return { ok: true as const, id: view.id };
}

export async function deleteContactViewAction(id: string) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");
  await deleteContactView(id, user.id);
  revalidatePath("/admin/crm/contacts");
  return { ok: true as const };
}

export async function countContactFilterAction(filter: ContactFilterV3) {
  await requireAdminUser("view_crm");
  const parsed = parseContactFilterV3(filter);
  const count = await countContactsMatchingFilter(parsed);
  return { count };
}

export async function updateContactViewAction(input: {
  id: string;
  name?: string;
  description?: string;
  filter?: ContactFilterV3;
  isShared?: boolean;
}) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");
  const filter = input.filter ? parseContactFilterV3(input.filter) : undefined;
  await updateContactView({
    id: input.id,
    name: input.name,
    description: input.description,
    filter,
    isShared: input.isShared,
    actorId: user.id,
  });
  revalidatePath("/admin/crm/contacts");
  return { ok: true as const };
}

export async function resolveContactListFiltersAction(input: {
  viewId?: string;
  filterJson?: string;
}) {
  const user = await requireAdminUser("view_crm");
  if (input.viewId) {
    const view = await getContactViewById(input.viewId, user.id);
    if (!view) return { advancedFilter: null };
    return { advancedFilter: parseContactFilterV3(view.filterJson) };
  }
  if (input.filterJson) {
    try {
      return { advancedFilter: parseContactFilterV3(JSON.parse(input.filterJson)) };
    } catch {
      return { advancedFilter: null };
    }
  }
  return { advancedFilter: null };
}
