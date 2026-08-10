import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getPortalUser } from "@/lib/portal/session";
import { getRequestForUser } from "@/lib/prospect/requests/service";
import { RequestClarificationForm } from "@/components/prospect/RequestClarificationForm";

export default async function WorkspaceRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getPortalUser();
  if (!user) redirect("/workspace/login");

  const { id } = await params;
  const request = await getRequestForUser(id, user.id);
  if (!request) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/workspace/requests" className="text-sm text-[#F47A48] hover:underline">
        ← All requests
      </Link>
      <header>
        <h1 className="text-2xl font-semibold">{request.title}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {request.statusLabel} · Submitted{" "}
          {new Date(request.submittedAt).toLocaleDateString()}
        </p>
      </header>

      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="font-semibold">What happens next?</h2>
        <p className="mt-2 text-sm text-neutral-600">{request.statusCopy}</p>
      </section>

      {request.linkedProposalId ? (
        <Link
          href={`/portal/proposals/${request.linkedProposalId}`}
          className="inline-block rounded-md bg-[#F47A48] px-4 py-2 text-sm font-medium text-white"
        >
          Review Proposal
        </Link>
      ) : null}

      {request.status === "NEEDS_INFORMATION" ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-semibold text-amber-900">Smartlance needs more information</h2>
          <RequestClarificationForm requestId={request.id} />
        </section>
      ) : null}

      {request.messages.length > 0 ? (
        <section>
          <h2 className="font-semibold">Messages</h2>
          <ul className="mt-3 space-y-3">
            {request.messages.map((m) => (
              <li
                key={m.id}
                className={`rounded-lg border p-4 text-sm ${
                  m.authorType === "SMARTLANCE"
                    ? "border-neutral-200 bg-white"
                    : "border-[#F47A48]/20 bg-[#F47A48]/5"
                }`}
              >
                <p className="text-xs font-medium text-neutral-500">
                  {m.authorType === "SMARTLANCE" ? "Smartlance" : "You"} ·{" "}
                  {new Date(m.createdAt).toLocaleString()}
                </p>
                <p className="mt-2 whitespace-pre-wrap">{m.body}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {request.timeline.length > 0 ? (
        <section>
          <h2 className="font-semibold">Timeline</h2>
          <ul className="mt-3 space-y-2 text-sm text-neutral-600">
            {request.timeline.map((t, i) => (
              <li key={i}>
                {new Date(t.createdAt).toLocaleDateString()} — {t.summary}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
