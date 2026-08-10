"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  AGENCY_PROJECT_HEALTH_LABELS,
  AGENCY_PROJECT_STATUS_LABELS,
  AGENCY_SERVICE_TYPE_LABELS,
} from "@/lib/agency/constants";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

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
    <AdminPanel className="flex flex-wrap gap-2">
      <form
        className="flex flex-wrap gap-2"
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
        <Input
          name="q"
          defaultValue={sp.get("q") ?? ""}
          placeholder="Search projects…"
          className="min-w-[200px] flex-1"
        />
        <Select name="status" defaultValue={sp.get("status") ?? ""}>
          <option value="">All statuses</option>
          {Object.entries(AGENCY_PROJECT_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
        <Select name="health" defaultValue={sp.get("health") ?? ""}>
          <option value="">All health</option>
          {Object.entries(AGENCY_PROJECT_HEALTH_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
        <Select name="ownerId" defaultValue={sp.get("ownerId") ?? ""}>
          <option value="">All owners</option>
          {owners.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </Select>
        <Select name="serviceType" defaultValue={sp.get("serviceType") ?? ""}>
          <option value="">All services</option>
          {Object.entries(AGENCY_SERVICE_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
        <Button type="submit" variant="outline" size="sm">
          Filter
        </Button>
      </form>
    </AdminPanel>
  );
}
