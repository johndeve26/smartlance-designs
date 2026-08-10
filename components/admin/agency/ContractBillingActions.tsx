"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createBillingScheduleAction,
  createInvoiceFromAcceptanceAction,
  createInvoiceFromInstallmentAction,
} from "@/lib/admin/billing-actions";

type Schedule = {
  id: string;
  installments: Array<{ id: string; label: string; status: string }>;
} | null;

export function ContractBillingActions({
  contractId,
  proposalAcceptanceId,
  currency,
  schedule,
}: {
  contractId: string;
  proposalAcceptanceId: string;
  currency: string;
  schedule: Schedule;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function createInvoice() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("proposalAcceptanceId", proposalAcceptanceId);
      fd.set("contractId", contractId);
      const result = await createInvoiceFromAcceptanceAction(fd);
      if (result.ok && result.id) router.push(`/admin/agency/invoices/${result.id}`);
    });
  }

  function createFromInstallment(installmentId: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("installmentId", installmentId);
      const result = await createInvoiceFromInstallmentAction(fd);
      if (result.ok && result.id) router.push(`/admin/agency/invoices/${result.id}`);
    });
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button
        type="button"
        disabled={pending}
        className="admin-btn admin-btn-secondary text-sm"
        onClick={createInvoice}
      >
        Create invoice
      </button>
      {schedule?.installments
        .filter((i) => i.status === "PENDING")
        .map((inst) => (
          <button
            key={inst.id}
            type="button"
            disabled={pending}
            className="admin-btn admin-btn-secondary text-sm"
            onClick={() => createFromInstallment(inst.id)}
          >
            Invoice: {inst.label}
          </button>
        ))}
    </div>
  );
}
