"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createManualContractAction } from "@/lib/admin/contract-actions";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";

export function ContractCreateForm({
  templateOptions,
}: {
  templateOptions: Array<{ id: string; name: string; versionId: string }>;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <AdminPanel className="max-w-xl space-y-3">
      <form
        className="space-y-3"
        onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const r = await createManualContractAction(fd);
          if (r.ok && r.id) router.push(`/admin/agency/contracts/${r.id}`);
          else alert(r.error ?? "Could not create contract.");
        });
      }}
    >
      <h1 className="text-xl font-semibold">New manual contract</h1>
      <p className="text-sm text-neutral-600">
        For NDAs, maintenance agreements, or clients without a proposal. Use professionally reviewed
        contract language.
      </p>
      <input name="title" required placeholder="Contract title" className="admin-input w-full" />
      <select name="contractType" className="admin-input w-full" defaultValue="OTHER">
        <option value="SERVICE_AGREEMENT">Service agreement</option>
        <option value="NDA">NDA</option>
        <option value="MAINTENANCE">Maintenance</option>
        <option value="OTHER">Other</option>
      </select>
      <select name="templateVersionId" className="admin-input w-full">
        <option value="">No template</option>
        {templateOptions.map((t) => (
          <option key={t.versionId} value={t.versionId}>
            {t.name}
          </option>
        ))}
      </select>
      <textarea
        name="content"
        placeholder="Optional initial content (markdown/plain text)"
        className="admin-input min-h-32 w-full"
      />
      <button type="submit" className="admin-btn admin-btn-primary" disabled={pending}>
        Create contract
      </button>
      </form>
    </AdminPanel>
  );
}
