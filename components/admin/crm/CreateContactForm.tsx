"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { createContactAction } from "@/lib/admin/crm-actions";

export function CreateContactForm() {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const r = await createContactAction(fd);
          if (!r.ok) alert(r.error);
          else if (r.id) router.push(`/admin/crm/contacts/${r.id}`);
        });
      }}
    >
      <Field label="Display name" name="displayName" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="First name" name="firstName" />
        <Field label="Last name" name="lastName" />
      </div>
      <Field label="Email" name="email" type="email" />
      <Field label="Phone" name="phone" />
      <Field label="Job title" name="jobTitle" />
      <Field label="Source detail" name="sourceDetail" />
      <div>
        <label className="admin-field-label">Source</label>
        <select name="source" defaultValue="MANUAL" className="admin-input w-full">
          <option value="MANUAL">Manual</option>
          <option value="REFERRAL">Referral</option>
          <option value="OUTBOUND">Outbound</option>
          <option value="SOCIAL">Social</option>
          <option value="OTHER">Other</option>
        </select>
      </div>
      <button type="submit" disabled={pending} className="admin-btn admin-btn-primary">
        {pending ? "Creating…" : "Create contact"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
}: {
  label: string;
  name: string;
  type?: string;
}) {
  return (
    <div>
      <label className="admin-field-label">{label}</label>
      <input name={name} type={type} className="admin-input w-full" />
    </div>
  );
}
