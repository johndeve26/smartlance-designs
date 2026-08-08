"use server";

import { redirect } from "next/navigation";
import type { AdminRole, AdminUserStatus } from "@prisma/client";
import { assertSameOrigin, requireAdminUser } from "@/lib/admin/session";
import {
  createAdminUser,
  updateAdminUser,
} from "@/lib/repositories/adminUsersRepository";

export type UserActionState = {
  error?: string;
  success?: string;
};

const ROLES: AdminRole[] = [
  "SUPER_ADMIN",
  "EDITOR",
  "CONTENT_MANAGER",
  "REVIEWER",
];

function parseRole(value: FormDataEntryValue | null): AdminRole | null {
  const role = String(value ?? "");
  return ROLES.includes(role as AdminRole) ? (role as AdminRole) : null;
}

export async function createUserAction(
  _prev: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  await assertSameOrigin();
  const actor = await requireAdminUser("manage_users");

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = parseRole(formData.get("role"));

  if (!name || !email || !password || !role) {
    return { error: "Name, email, password, and role are required." };
  }
  if (password.length < 10) {
    return { error: "Password must be at least 10 characters." };
  }

  try {
    await createAdminUser({
      name,
      email,
      password,
      role,
      actorId: actor.id,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create user.";
    if (message.includes("Unique constraint") || message.includes("unique")) {
      return { error: "A user with that email already exists." };
    }
    return { error: message };
  }

  redirect("/admin/users?created=1");
}

export async function updateUserRoleAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdminUser("manage_users");
  const id = String(formData.get("id") ?? "");
  const role = parseRole(formData.get("role"));
  if (!id || !role) throw new Error("Invalid role update");
  if (id === actor.id && role !== "SUPER_ADMIN") {
    throw new Error("You cannot remove your own Super Admin role.");
  }
  try {
    await updateAdminUser({ id, actorId: actor.id, role });
  } catch (err) {
    throw new Error(
      err instanceof Error ? err.message : "Failed to update role.",
    );
  }
  redirect("/admin/users?updated=1");
}

export async function setUserStatusAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdminUser("manage_users");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as AdminUserStatus;
  if (!id || (status !== "ACTIVE" && status !== "DISABLED")) {
    throw new Error("Invalid status update");
  }
  if (id === actor.id && status === "DISABLED") {
    throw new Error("You cannot disable your own account.");
  }
  try {
    await updateAdminUser({ id, actorId: actor.id, status });
  } catch (err) {
    throw new Error(
      err instanceof Error ? err.message : "Failed to update status.",
    );
  }
  redirect("/admin/users?updated=1");
}
