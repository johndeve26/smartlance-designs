"use client";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { createCompanyAction } from "@/lib/admin/crm-actions";

export function CreateCompanyForm() {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <AdminPanel className="max-w-xl">
      <form
        className="space-y-4"
        onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await createCompanyAction(new FormData(e.currentTarget));
          if (!r.ok) alert(r.error);
          else if (r.id) router.push(`/admin/crm/companies/${r.id}`);
        });
      }}
    >
      <input name="name" required placeholder="Company name" className="admin-input w-full" />
      <input name="website" placeholder="Website" className="admin-input w-full" />
      <input name="industry" placeholder="Industry" className="admin-input w-full" />
      <input name="location" placeholder="Location" className="admin-input w-full" />
      <button type="submit" disabled={pending} className="admin-btn admin-btn-primary">
        Create company
      </button>
      </form>
    </AdminPanel>
  );
}
