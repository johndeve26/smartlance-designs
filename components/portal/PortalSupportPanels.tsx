"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  portalCreateSupportRequestAction,
  portalReplySupportAction,
  portalConfirmSupportResolvedAction,
  portalStillNeedHelpAction,
} from "@/lib/portal/support-actions";
import {
  SUPPORT_CATEGORY,
  SUPPORT_CATEGORY_HELP,
  SUPPORT_PRIORITY,
} from "@/lib/client-success/constants";
import type { PortalSupportSummary } from "@/lib/portal/support";
import { PortalCard, PortalPrimaryButton } from "@/components/portal/PortalShell";

export function PortalSupportList({
  needsResponse,
  open,
  resolved,
}: {
  needsResponse: PortalSupportSummary[];
  open: PortalSupportSummary[];
  resolved: PortalSupportSummary[];
}) {
  const hasAny = needsResponse.length || open.length || resolved.length;

  if (!hasAny) {
    return (
      <PortalCard>
        <p className="text-sm font-medium text-[#535353]">No support requests yet.</p>
        <p className="mt-1 text-sm text-neutral-600">
          Need help with your website? Submit a support request and we&apos;ll get back to you.
        </p>
        <div className="mt-4">
          <PortalPrimaryButton href="/portal/support/new">Request support</PortalPrimaryButton>
        </div>
      </PortalCard>
    );
  }

  return (
    <div className="space-y-6">
      {needsResponse.length ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#535353]">Needs your response</h2>
          <div className="space-y-3">
            {needsResponse.map((s) => (
              <SupportCard key={s.id} item={s} highlight />
            ))}
          </div>
        </section>
      ) : null}

      {open.length ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#535353]">Open</h2>
          <div className="space-y-3">
            {open.map((s) => (
              <SupportCard key={s.id} item={s} />
            ))}
          </div>
        </section>
      ) : null}

      {resolved.length ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#535353]">Resolved</h2>
          <div className="space-y-3">
            {resolved.map((s) => (
              <SupportCard key={s.id} item={s} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function SupportCard({ item, highlight }: { item: PortalSupportSummary; highlight?: boolean }) {
  return (
    <Link href={item.href}>
      <article
        className={`rounded-lg border bg-white p-4 shadow-sm transition-colors hover:bg-neutral-50 ${
          highlight ? "border-l-4 border-l-[#F47A48] border-neutral-200" : "border-neutral-200"
        }`}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              {item.statusLabel}
            </p>
            <h3 className="mt-1 font-semibold text-[#535353]">{item.subject}</h3>
            <p className="text-sm text-neutral-600">
              {item.websiteDomain} · {item.supportNumber}
            </p>
            <p className="text-sm text-neutral-500">Updated {item.updatedLabel}</p>
          </div>
          <span className="text-sm font-medium text-[#F47A48]">
            {item.needsResponse ? "Respond" : "View request"}
          </span>
        </div>
      </article>
    </Link>
  );
}

export function PortalSupportCreateForm({
  websites,
  defaultWebsiteId,
}: {
  websites: Awaited<ReturnType<typeof import("@/lib/portal/support").listPortalWebsitesForSupportForm>>;
  defaultWebsiteId?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!websites.length) {
    return (
      <PortalCard>
        <p className="text-sm text-neutral-600">
          You don&apos;t have permission to submit support requests for any managed websites.
        </p>
      </PortalCard>
    );
  }

  return (
    <PortalCard>
      <form
        className="space-y-4"
        action={(fd) => {
          setError(null);
          startTransition(async () => {
            const result = await portalCreateSupportRequestAction(fd);
            if (result.ok) {
              router.push(`/portal/support/${result.id}`);
              router.refresh();
            } else {
              setError(result.error);
            }
          });
        }}
      >
        <div>
          <h2 className="text-lg font-semibold text-[#535353]">What can we help with?</h2>
          <p className="text-sm text-neutral-600">
            Tell us what&apos;s happening and we&apos;ll review your request.
          </p>
        </div>

        <label className="block text-sm">
          <span className="font-medium">Website</span>
          <select
            name="websiteId"
            required
            defaultValue={defaultWebsiteId ?? websites[0]?.id}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
          >
            {websites.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.domain})
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-medium">Type of request</span>
          <select name="category" required className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2">
            {Object.entries(SUPPORT_CATEGORY).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-neutral-500">{SUPPORT_CATEGORY_HELP.WEBSITE_CHANGE}</p>
        </label>

        <label className="block text-sm">
          <span className="font-medium">Subject</span>
          <input
            name="subject"
            required
            maxLength={200}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
            placeholder="Brief summary of your request"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium">Tell us what&apos;s happening</span>
          <textarea
            name="description"
            required
            rows={6}
            maxLength={20000}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
            placeholder="Include as much detail as you can — pages affected, steps to reproduce, etc."
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium">Priority</span>
          <select name="priority" defaultValue="NORMAL" className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2">
            {Object.entries(SUPPORT_PRIORITY).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-neutral-500">
            Use Urgent for issues significantly affecting your live website.
          </p>
        </label>

        <label className="block text-sm">
          <span className="font-medium">Attachments (optional)</span>
          <input
            type="file"
            name="attachments"
            multiple
            accept="image/*,.pdf,.doc,.docx"
            className="mt-1 block w-full text-sm"
          />
          <p className="mt-1 text-xs text-neutral-500">Up to 5 files. Screenshots help us diagnose issues faster.</p>
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-[#F47A48] px-4 py-2 text-sm font-medium text-white hover:bg-[#e06a38] disabled:opacity-50"
        >
          {pending ? "Submitting…" : "Submit request"}
        </button>
      </form>
    </PortalCard>
  );
}

type SupportDetail = Awaited<ReturnType<typeof import("@/lib/portal/support").getPortalSupportDetail>>;

export function PortalSupportDetailView({ detail }: { detail: SupportDetail }) {
  const { request, messages, files, changeRequest } = detail;
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="space-y-6">
      <header className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-neutral-600">{request.supportNumber}</p>
        <h1 className="mt-1 text-2xl font-semibold text-[#535353]">{request.subject}</h1>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-neutral-600">Status</dt>
            <dd className="font-medium">{request.statusLabel}</dd>
          </div>
          <div>
            <dt className="text-neutral-600">Website</dt>
            <dd>
              <Link href={`/portal/websites/${request.website.id}`} className="hover:underline">
                {request.website.domain}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-neutral-600">Submitted</dt>
            <dd>{request.submittedLabel}</dd>
          </div>
          <div>
            <dt className="text-neutral-600">Category</dt>
            <dd>{request.categoryLabel}</dd>
          </div>
        </dl>
      </header>

      {changeRequest?.needsScopeReview ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h2 className="font-semibold text-[#535353]">This request needs scope approval</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Smartlance has linked this request to a change that requires your review.
          </p>
          <Link
            href={changeRequest.href}
            className="mt-3 inline-block text-sm font-medium text-[#F47A48] hover:underline"
          >
            Review change request
          </Link>
        </div>
      ) : null}

      <PortalCard>
        <h2 className="mb-4 font-semibold text-[#535353]">Your request</h2>
        <p className="whitespace-pre-wrap text-sm text-neutral-700">{request.description}</p>
        {files.length ? (
          <ul className="mt-4 space-y-1 text-sm">
            {files.map((f) => (
              <li key={f.id}>
                <a href={f.downloadHref} className="text-[#F47A48] hover:underline">
                  {f.name}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </PortalCard>

      <PortalCard>
        <h2 className="mb-4 font-semibold text-[#535353]">Conversation</h2>
        {messages.length ? (
          <ul className="space-y-4">
            {messages.map((m) => (
              <li
                key={m.id}
                className={`rounded-md p-3 text-sm ${
                  m.isClient ? "bg-neutral-100" : "border border-neutral-200 bg-white"
                }`}
              >
                <p className="text-xs font-medium text-neutral-500">
                  {m.authorLabel} · {m.dateLabel}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-neutral-700">{m.body}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-600">No messages yet.</p>
        )}

        {request.canReply ? (
          <form
            className="mt-4 space-y-2 border-t border-neutral-100 pt-4"
            action={(fd) => {
              setError(null);
              startTransition(async () => {
                fd.set("supportRequestId", request.id);
                const result = await portalReplySupportAction(fd);
                if (result.ok) router.refresh();
                else setError(result.error);
              });
            }}
          >
            <label className="block text-sm font-medium">Your reply</label>
            <textarea
              name="body"
              required
              rows={4}
              maxLength={20000}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-[#F47A48] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Send reply
            </button>
          </form>
        ) : null}
      </PortalCard>

      {request.canConfirmResolved ? (
        <PortalCard>
          <h2 className="font-semibold text-[#535353]">Is this resolved?</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Smartlance marked this request as resolved. Please confirm or let us know if you still need help.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <form
              action={(fd) => {
                startTransition(async () => {
                  fd.set("supportRequestId", request.id);
                  await portalConfirmSupportResolvedAction(fd);
                  router.refresh();
                });
              }}
            >
              <button
                type="submit"
                disabled={pending}
                className="rounded-md bg-[#F47A48] px-4 py-2 text-sm font-medium text-white"
              >
                Confirm resolved
              </button>
            </form>
            <form
              className="flex flex-1 flex-col gap-2 sm:flex-row"
              action={(fd) => {
                setError(null);
                startTransition(async () => {
                  fd.set("supportRequestId", request.id);
                  const result = await portalStillNeedHelpAction(fd);
                  if (result.ok) router.refresh();
                  else setError(result.error);
                });
              }}
            >
              <input
                name="message"
                required
                placeholder="What still needs attention?"
                className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={pending}
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium"
              >
                Still need help
              </button>
            </form>
          </div>
          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        </PortalCard>
      ) : null}
    </div>
  );
}
