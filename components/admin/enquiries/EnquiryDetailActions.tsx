"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { EnquiryStatus, NotificationStatus } from "@prisma/client";
import {
  addEnquiryNoteAction,
  anonymizeEnquiryAction,
  changeEnquiryStatusAction,
  deleteEnquiryAction,
  retryEnquiryNotificationAction,
} from "@/lib/admin/enquiry-actions";

export function EnquiryDetailActions({
  enquiry,
  canManage,
  canDestroy,
  notes,
}: {
  enquiry: {
    id: string;
    type: "CONTACT" | "WEBSITE_REVIEW";
    status: EnquiryStatus;
    notificationStatus: NotificationStatus;
    isAnonymized: boolean;
  };
  canManage: boolean;
  canDestroy: boolean;
  notes: Array<{
    id: string;
    body: string;
    createdAt: string;
    authorName: string;
  }>;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!canManage && !canDestroy) {
    return (
      <section className="rounded-lg border bg-white p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Internal notes
        </h2>
        <NotesList notes={notes} />
      </section>
    );
  }

  return (
    <div className="space-y-4">
      {canManage && !enquiry.isAnonymized ? (
        <section className="rounded-lg border bg-white p-4 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Status
          </h2>
          <form
            className="flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              start(async () => {
                const res = await changeEnquiryStatusAction(fd);
                setMessage(res.ok ? "Status updated." : res.error);
                if (res.ok) router.refresh();
              });
            }}
          >
            <input type="hidden" name="id" value={enquiry.id} />
            <input type="hidden" name="type" value={enquiry.type} />
            <select
              name="status"
              defaultValue={enquiry.status}
              className="rounded border px-3 py-2 text-sm"
            >
              {(
                [
                  "NEW",
                  "REVIEWING",
                  "REPLIED",
                  "QUALIFIED",
                  "CLOSED",
                  "SPAM",
                ] as EnquiryStatus[]
              ).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={pending}
              className="rounded bg-neutral-900 px-3 py-2 text-sm text-white"
            >
              Update status
            </button>
          </form>
          {enquiry.notificationStatus === "FAILED" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                start(async () => {
                  const res = await retryEnquiryNotificationAction(fd);
                  setMessage(
                    res.ok
                      ? `Notification retry: ${res.status}`
                      : res.error,
                  );
                  if (res.ok) router.refresh();
                });
              }}
            >
              <input type="hidden" name="id" value={enquiry.id} />
              <input type="hidden" name="type" value={enquiry.type} />
              <button
                type="submit"
                disabled={pending}
                className="text-sm text-amber-800 underline"
              >
                Retry notification
              </button>
            </form>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-lg border bg-white p-4 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Internal notes
        </h2>
        <NotesList notes={notes} />
        {canManage && !enquiry.isAnonymized ? (
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const fd = new FormData(form);
              start(async () => {
                const res = await addEnquiryNoteAction(fd);
                setMessage(res.ok ? "Note added." : res.error);
                if (res.ok) {
                  form.reset();
                  router.refresh();
                }
              });
            }}
          >
            <input type="hidden" name="enquiryId" value={enquiry.id} />
            <input type="hidden" name="type" value={enquiry.type} />
            <label className="block text-sm">
              Add note
              <textarea
                name="body"
                required
                rows={3}
                className="mt-1 w-full rounded border px-3 py-2"
                placeholder="Private operational note…"
              />
            </label>
            <button
              type="submit"
              disabled={pending}
              className="rounded border px-3 py-1.5 text-sm"
            >
              Save note
            </button>
          </form>
        ) : null}
      </section>

      {canDestroy ? (
        <section className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-red-900">Privacy actions</h2>
          {!enquiry.isAnonymized ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (
                  !confirm(
                    "Anonymize this enquiry? Personal fields and notes will be cleared. This cannot be undone.",
                  )
                ) {
                  return;
                }
                const fd = new FormData(e.currentTarget);
                start(async () => {
                  const res = await anonymizeEnquiryAction(fd);
                  setMessage(res.ok ? "Anonymized." : res.error);
                  if (res.ok) router.refresh();
                });
              }}
            >
              <input type="hidden" name="id" value={enquiry.id} />
              <input type="hidden" name="type" value={enquiry.type} />
              <button type="submit" className="text-sm text-red-800 underline">
                Anonymize personal data
              </button>
            </form>
          ) : null}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (
                !confirm(
                  "Permanently delete this enquiry? This cannot be undone.",
                )
              ) {
                return;
              }
              const fd = new FormData(e.currentTarget);
              start(async () => {
                const res = await deleteEnquiryAction(fd);
                if (!res.ok) setMessage(res.error);
                else {
                  router.push(
                    enquiry.type === "CONTACT"
                      ? "/admin/enquiries/contact"
                      : "/admin/enquiries/reviews",
                  );
                }
              });
            }}
          >
            <input type="hidden" name="id" value={enquiry.id} />
            <input type="hidden" name="type" value={enquiry.type} />
            <button type="submit" className="text-sm font-semibold text-red-800 underline">
              Permanent delete
            </button>
          </form>
        </section>
      ) : null}

      {message ? (
        <p className="text-sm text-neutral-700" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}

function NotesList({
  notes,
}: {
  notes: Array<{
    id: string;
    body: string;
    createdAt: string;
    authorName: string;
  }>;
}) {
  if (!notes.length) {
    return <p className="text-sm text-neutral-500">No notes yet.</p>;
  }
  return (
    <ul className="space-y-3">
      {notes.map((note) => (
        <li key={note.id} className="rounded border border-neutral-100 bg-neutral-50 p-3 text-sm">
          <p className="whitespace-pre-wrap break-words">{note.body}</p>
          <p className="mt-2 text-xs text-neutral-500">
            {note.authorName} · {note.createdAt.slice(0, 16).replace("T", " ")}
          </p>
        </li>
      ))}
    </ul>
  );
}
