"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { burnPasswordVerification, verifyPassword } from "@/lib/admin/crypto";
import {
  assertSameOrigin,
  clearSessionCookie,
  createAdminSession,
  getSessionUser,
  isLoginAttemptBlocked,
  revokeSessionByToken,
  setSessionCookie,
} from "@/lib/admin/session";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin/crypto";
import { cookies } from "next/headers";
import { writeAuditLog } from "@/lib/repositories/auditRepository";

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  await assertSameOrigin();

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  if (await isLoginAttemptBlocked(email)) {
    return { error: "Too many login attempts. Try again in a few minutes." };
  }

  const user = await prisma.adminUser.findUnique({ where: { email } });
  if (!user || user.status !== "ACTIVE") {
    await burnPasswordVerification(password);
    return { error: "Invalid email or password." };
  }

  const ok = await verifyPassword(user.passwordHash, password);
  if (!ok) {
    return { error: "Invalid email or password." };
  }

  const { token, expiresAt } = await createAdminSession(user.id);
  await setSessionCookie(token, expiresAt);
  await prisma.adminUser.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  await writeAuditLog({
    actorId: user.id,
    action: "auth.login",
    entityType: "AdminUser",
    entityId: user.id,
  });

  redirect("/admin");
}

export async function logoutAction() {
  await assertSameOrigin();
  const jar = await cookies();
  const token = jar.get(ADMIN_SESSION_COOKIE)?.value;
  if (token) {
    const user = await getSessionUser();
    await revokeSessionByToken(token);
    if (user) {
      await writeAuditLog({
        actorId: user.id,
        action: "auth.logout",
        entityType: "AdminUser",
        entityId: user.id,
      });
    }
  }
  await clearSessionCookie();
  redirect("/admin/login");
}
