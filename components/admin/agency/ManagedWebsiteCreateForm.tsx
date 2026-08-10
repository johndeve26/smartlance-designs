"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminCreateManagedWebsiteAction } from "@/lib/admin/client-success-actions";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";

export function ManagedWebsiteCreateForm({
  companies,
  projects,
  contacts,
}: {
  companies: { id: string; name: string }[];
  projects: { id: string; name: string; projectNumber: string }[];
  contacts: { id: string; label: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <AdminPanel className="space-y-4">
      <form
        className="space-y-4"
        action={(fd) => {
        startTransition(async () => {
          const result = await adminCreateManagedWebsiteAction(fd);
          if (result.ok) router.push(`/admin/agency/websites/${result.id}`);
        });
      }}
    >
      <label className="block text-sm">
        Website name
        <input name="name" required className="admin-input mt-1 w-full" />
      </label>
      <label className="block text-sm">
        Domain
        <input name="domain" required placeholder="example.com" className="admin-input mt-1 w-full" />
      </label>
      <label className="block text-sm">
        Production URL
        <input name="productionUrl" placeholder="https://example.com" className="admin-input mt-1 w-full" />
      </label>
      <label className="block text-sm">
        Company
        <select name="companyId" className="admin-input mt-1 w-full">
          <option value="">None</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Primary project
        <select name="primaryProjectId" className="admin-input mt-1 w-full">
          <option value="">None</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.projectNumber} — {p.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Platform
        <select name="platform" className="admin-input mt-1 w-full">
          <option value="">Unknown</option>
          <option value="WORDPRESS">WordPress</option>
          <option value="SHOPIFY">Shopify</option>
          <option value="WEBFLOW">Webflow</option>
          <option value="FRAMER">Framer</option>
          <option value="CUSTOM">Custom</option>
          <option value="OTHER">Other</option>
        </select>
      </label>
      <label className="block text-sm">
        Care status
        <select name="careStatus" defaultValue="NOT_ENROLLED" className="admin-input mt-1 w-full">
          <option value="NOT_ENROLLED">Not enrolled</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
          <option value="ENDED">Ended</option>
        </select>
      </label>
      <label className="block text-sm">
        Care plan name
        <input name="carePlanName" placeholder="Website Care" className="admin-input mt-1 w-full" />
      </label>
      <label className="block text-sm">
        Grant primary contact access
        <select name="primaryContactId" className="admin-input mt-1 w-full">
          <option value="">None</option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={pending} className="admin-btn">
        Create managed website
      </button>
      </form>
    </AdminPanel>
  );
}
