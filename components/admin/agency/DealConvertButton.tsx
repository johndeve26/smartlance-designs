"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { convertWonDealAction } from "@/lib/admin/agency-actions";

type Template = { id: string; name: string };

export function DealConvertButton({
  dealId,
  dealTitle,
  dealStage,
  existingProject,
  templates,
}: {
  dealId: string;
  dealTitle: string;
  dealStage: string;
  existingProject?: { id: string; name: string; projectNumber: string } | null;
  templates: Template[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  if (existingProject) {
    return (
      <Link href={`/admin/agency/projects/${existingProject.id}`} className="admin-btn admin-btn-secondary">
        View project ({existingProject.projectNumber})
      </Link>
    );
  }

  const canConvert = dealStage === "WON";

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/admin/agency/projects/new?dealId=${dealId}`}
        className="admin-btn admin-btn-secondary"
      >
        Create project
      </Link>
      {canConvert ? (
        <button
          type="button"
          disabled={pending}
          className="admin-btn admin-btn-primary"
          onClick={() => {
            const templateId = templates.length === 1 ? templates[0]!.id : undefined;
            const fd = new FormData();
            fd.set("dealId", dealId);
            if (templateId) fd.set("templateId", templateId);
            fd.set("name", `${dealTitle} — Project`);
            start(async () => {
              const r = await convertWonDealAction(fd);
              if (!r.ok) alert(r.error);
              else if (r.id) router.push(`/admin/agency/projects/${r.id}`);
            });
          }}
        >
          {pending ? "Converting…" : "Convert won deal"}
        </button>
      ) : (
        <span className="self-center text-xs text-neutral-500">
          Mark deal as Won to convert instantly.
        </span>
      )}
    </div>
  );
}
