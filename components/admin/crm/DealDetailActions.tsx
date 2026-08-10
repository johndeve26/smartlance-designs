"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { CrmDeal } from "@prisma/client";
import { updateDealStageAction } from "@/lib/admin/crm-actions";
import { CRM_DEAL_STAGE_LABELS } from "@/lib/crm/display";

export function DealDetailActions({ deal }: { deal: CrmDeal }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className="admin-input text-sm"
        defaultValue={deal.stage}
        disabled={pending}
        onChange={(e) => {
          const stage = e.target.value;
          let lostReason: string | undefined;
          if (stage === "LOST") {
            lostReason = window.prompt("Lost reason (PRICE, NO_RESPONSE, COMPETITOR, TIMING, INTERNAL_DECISION, NOT_A_FIT, OTHER)") ?? undefined;
            if (!lostReason) return;
          }
          const fd = new FormData();
          fd.set("dealId", deal.id);
          fd.set("stage", stage);
          if (lostReason) fd.set("lostReason", lostReason);
          start(async () => {
            const r = await updateDealStageAction(fd);
            if (!r.ok) alert(r.error);
            else router.refresh();
          });
        }}
      >
        {Object.entries(CRM_DEAL_STAGE_LABELS).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
    </div>
  );
}
