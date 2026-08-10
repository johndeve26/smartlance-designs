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
  installments: Array<{ id: string; label: string; status: string; amountMinor: number }>;
};

export function ProposalBillingActions({
  proposalAcceptanceId,
  currency,
  schedule,
}: {
  proposalAcceptanceId: string;
  currency: string;
  schedule: Schedule | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function create505020Schedule() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("proposalAcceptanceId", proposalAcceptanceId);
      fd.set("currency", currency);
      fd.set(
        "installmentsJson",
        JSON.stringify([
          { label: "Deposit", type: "DEPOSIT", percentageBasisPoints: 5000 },
          { label: "Design approval", type: "MILESTONE", percentageBasisPoints: 3000 },
          { label: "Before launch", type: "FINAL", percentageBasisPoints: 2000 },
        ]),
      );
      await createBillingScheduleAction(fd);
      router.refresh();
    });
  }

  function createInvoice() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("proposalAcceptanceId", proposalAcceptanceId);
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
      {!schedule ? (
        <button
          type="button"
          disabled={pending}
          className="admin-btn admin-btn-secondary text-sm"
          onClick={create505020Schedule}
        >
          Create 50/30/20 schedule
        </button>
      ) : null}
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
