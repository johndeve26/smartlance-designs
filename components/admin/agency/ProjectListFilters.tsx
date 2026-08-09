"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  AGENCY_PROJECT_HEALTH_LABELS,
  AGENCY_PROJECT_STATUS_LABELS,
  AGENCY_SERVICE_TYPE_LABELS,
} from "@/lib/agency/constants";

type Owner = { id: string; name: string };

export function ProjectListFilters({ owners }: { owners: Owner[] }) {
  const router = useRouter();
  const sp = useSearchParams();

  function push(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    params.delete("page");
    router.push(`/admin/agency/projects?${params.toString()}`);
  }

  return (
    <form
      className="admin-card flex flex-wrap gap-2 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        push({
          q: String(fd.get("q") || "") || undefined,
          status: String(fd.get("status") || "") || undefined,
          health: String(fd.get("health") || "") || undefined,
          ownerId: String(fd.get("ownerId") || "") || undefined,
          serviceType: String(fd.get("serviceType") || "") || undefined,
        });
      }}
    >
      <input
        name="q"
        defaultValue={sp.get("q") ?? ""}
        placeholder="Search projects…"
        className="admin-input min-w-[200px] flex-1"
      />
      <select name="status" defaultValue={sp.get("status") ?? ""} className="admin-input">
        <option value="">All statuses</option>
        {Object.entries(AGENCY_PROJECT_STATUS_LABELS).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
      <select name="health" defaultValue={sp.get("health") ?? ""} className="admin-input">
        <option value="">All health</option>
        {Object.entries(AGENCY_PROJECT_HEALTH_LABELS).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
      <select name="ownerId" defaultValue={sp.get("ownerId") ?? ""} className="admin-input">
        <option value="">All owners</option>
        {owners.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
      <select name="serviceType" defaultValue={sp.get("serviceType") ?? ""} className="admin-input">
        <option value="">All services</option>
        {Object.entries(AGENCY_SERVICE_TYPE_LABELS).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
      <button type="submit" className="admin-btn admin-btn-secondary">Filter</button>
    </form>
  );
}
