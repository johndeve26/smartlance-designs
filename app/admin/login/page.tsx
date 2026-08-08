import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { getSessionUser } from "@/lib/admin/session";
import { hasDatabaseUrl } from "@/lib/db";
import "@/components/admin/admin.css";

export const metadata: Metadata = {
  title: "Login",
};

export default async function AdminLoginPage() {
  if (hasDatabaseUrl()) {
    const user = await getSessionUser();
    if (user) redirect("/admin");
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-16">
      <LoginForm />
      {!hasDatabaseUrl() ? (
        <p className="absolute bottom-8 left-0 right-0 text-center text-sm text-neutral-500">
          DATABASE_URL is not configured.
        </p>
      ) : null}
    </div>
  );
}
