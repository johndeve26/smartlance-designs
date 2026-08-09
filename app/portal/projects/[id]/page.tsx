import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPortalProject } from "@/lib/portal/projects";
import { getPortalUser } from "@/lib/portal/session";
import {
  AGENCY_DELIVERABLE_STATUS_LABELS,
  AGENCY_MILESTONE_STATUS_LABELS,
  AGENCY_PROJECT_STATUS_LABELS,
  AGENCY_REQUIREMENT_STATUS_LABELS,
} from "@/lib/agency/constants";
import { formatDate } from "@/lib/agency/display";
import { PortalDeliverableReview } from "@/components/portal/PortalDeliverableReview";

export const dynamic = "force-dynamic";

export default async function PortalProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getPortalUser();
  if (!user) redirect("/portal/login");

  const { id } = await params;
  const project = await getPortalProject(user.id, id);
  if (!project) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/portal" className="text-sm text-neutral-600 hover:underline">
          ← Your projects
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{project.name}</h1>
        <p className="text-sm text-neutral-600">
          {project.projectNumber} · {AGENCY_PROJECT_STATUS_LABELS[project.status]}
        </p>
        {project.summary ? (
          <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-700">{project.summary}</p>
        ) : null}
      </div>

      <section className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Milestones</h2>
        <ul className="divide-y text-sm">
          {project.milestones.map((m) => (
            <li key={m.id} className="py-2">
              <p className="font-medium">{m.title}</p>
              <p className="text-neutral-600">
                {AGENCY_MILESTONE_STATUS_LABELS[m.status]}
                {m.dueDate ? ` · Due ${formatDate(m.dueDate)}` : ""}
              </p>
            </li>
          ))}
          {!project.milestones.length ? (
            <li className="py-2 text-neutral-500">No milestones shared yet.</li>
          ) : null}
        </ul>
      </section>

      <section className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Requirements</h2>
        <ul className="divide-y text-sm">
          {project.requirements.map((r) => (
            <li key={r.id} className="py-2">
              <p className="font-medium">{r.title}</p>
              <p className="text-neutral-600">
                {AGENCY_REQUIREMENT_STATUS_LABELS[r.status]}
                {r.dueDate ? ` · Due ${formatDate(r.dueDate)}` : ""}
              </p>
            </li>
          ))}
          {!project.requirements.length ? (
            <li className="py-2 text-neutral-500">No requirements shared yet.</li>
          ) : null}
        </ul>
      </section>

      <section className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Deliverables</h2>
        <ul className="space-y-4 text-sm">
          {project.deliverables.map((d) => (
            <li key={d.id} className="rounded border p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{d.title}</p>
                  <p className="text-neutral-600">{AGENCY_DELIVERABLE_STATUS_LABELS[d.status]}</p>
                </div>
                {d.versions[0]?.externalUrl ? (
                  <a
                    href={d.versions[0].externalUrl}
                    className="text-sm underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open preview
                  </a>
                ) : d.versions[0]?.file ? (
                  <a href={`/api/agency/files/${d.versions[0].file.id}`} className="text-sm underline">
                    Download {d.versions[0].file.filename}
                  </a>
                ) : null}
              </div>
              {d.reviews[0]?.comment ? (
                <p className="mt-2 text-neutral-600">Latest feedback: {d.reviews[0].comment}</p>
              ) : null}
              <PortalDeliverableReview
                deliverableId={d.id}
                versionId={d.versions[0]?.id}
                status={d.status}
              />
            </li>
          ))}
          {!project.deliverables.length ? (
            <li className="text-neutral-500">No deliverables shared yet.</li>
          ) : null}
        </ul>
      </section>

      {project.updates.length ? (
        <section className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Updates</h2>
          <ul className="divide-y text-sm">
            {project.updates.map((u) => (
              <li key={u.id} className="py-2">
                <p className="font-medium">{u.title}</p>
                <p className="whitespace-pre-wrap text-neutral-700">{u.body}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
