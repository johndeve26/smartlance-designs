"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createContractTemplateAction } from "@/lib/admin/contract-actions";
import { CONTRACT_VARIABLE_DEFINITIONS } from "@/lib/contracts/variables";
import { AdminDetailHeader } from "@/components/admin/patterns/AdminDetailHeader";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NewContractTemplatePage() {
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <div className="space-y-6">
      <Link href="/admin/agency/contract-templates" className="text-sm text-muted hover:underline">
        ← Contract templates
      </Link>

      <AdminDetailHeader
        title="Create contract template"
        subtitle="Use contract language reviewed for your business and jurisdiction. No legal text is auto-seeded."
      />

      <AdminPanel className="max-w-3xl space-y-3">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            start(async () => {
              const r = await createContractTemplateAction(fd);
              if (r.ok && r.id) router.push(`/admin/agency/contract-templates/${r.id}`);
              else alert(r.error ?? "Could not create template.");
            });
          }}
        >
          <Input name="name" required placeholder="Template name" />
          <textarea name="description" placeholder="Description (optional)" className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" />
          <textarea
            name="content"
            required
            placeholder="Contract body with allowlisted variables e.g. {{client_company_name}}"
            className="min-h-64 w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-sm"
          />
          <div className="rounded-lg border border-border bg-surface-muted p-3 text-sm">
            <p className="font-medium">Allowlisted variables</p>
            <ul className="mt-2 columns-2 gap-4 text-xs text-muted">
              {CONTRACT_VARIABLE_DEFINITIONS.map((v) => (
                <li key={v.key}>{`{{${v.key}}}`} — {v.label}</li>
              ))}
            </ul>
          </div>
          <Button type="submit" disabled={pending}>
            Create template
          </Button>
        </form>
      </AdminPanel>
    </div>
  );
}
