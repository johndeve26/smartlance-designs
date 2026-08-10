"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { saveEmailTemplateAction } from "@/lib/admin/crm-actions";

export function EmailTemplateForm() {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <form
      className="mt-4 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await saveEmailTemplateAction(new FormData(e.currentTarget));
          if (!r.ok) alert(r.error);
          else router.refresh();
        });
      }}
    >
      <input name="name" required placeholder="Template name" className="admin-input w-full" />
      <input name="subject" required placeholder="Subject" className="admin-input w-full" />
      <textarea name="body" required rows={6} placeholder="Body ({{firstName}}, {{companyName}}, {{senderName}})" className="admin-input w-full" />
      <input name="category" placeholder="Category" className="admin-input w-full" />
      <button type="submit" disabled={pending} className="admin-btn admin-btn-primary">
        Save template
      </button>
    </form>
  );
}
