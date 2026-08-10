"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  ignoreInboxEmailAction,
  markInboxReviewedAction,
  linkInboxToContactAction,
  createContactFromInboxAction,
} from "@/lib/admin/crm-inbox-actions";
import { runInboundSyncNowAction } from "@/lib/admin/inbound-email-settings-actions";

export function InboxDetailActions({
  emailId,
  contactId,
}: {
  emailId: string;
  contactId: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={pending}
        className="admin-btn admin-btn-secondary text-sm"
        onClick={() => {
          const fd = new FormData();
          fd.set("id", emailId);
          start(async () => {
            await markInboxReviewedAction(fd);
            router.refresh();
          });
        }}
      >
        Mark reviewed
      </button>
      <button
        type="button"
        disabled={pending}
        className="admin-btn admin-btn-secondary text-sm"
        onClick={() => {
          const fd = new FormData();
          fd.set("id", emailId);
          start(async () => {
            await ignoreInboxEmailAction(fd);
            router.refresh();
          });
        }}
      >
        Ignore
      </button>
      {!contactId ? (
        <>
          <button
            type="button"
            disabled={pending}
            className="admin-btn admin-btn-primary text-sm"
            onClick={() => {
              const fd = new FormData();
              fd.set("emailId", emailId);
              start(async () => {
                const r = await createContactFromInboxAction(fd);
                if (r.ok && r.contactId) router.push(`/admin/crm/contacts/${r.contactId}`);
                else router.refresh();
              });
            }}
          >
            Create contact
          </button>
          <LinkContactForm emailId={emailId} pending={pending} />
        </>
      ) : null}
    </div>
  );
}

function LinkContactForm({ emailId, pending }: { emailId: string; pending: boolean }) {
  const router = useRouter();
  const [pendingLocal, start] = useTransition();
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("emailId", emailId);
        start(async () => {
          const r = await linkInboxToContactAction(fd);
          if (!r.ok) alert(r.error);
          router.refresh();
        });
      }}
    >
      <input name="contactId" required placeholder="Contact ID" className="admin-input text-sm" />
      <button type="submit" disabled={pending || pendingLocal} className="admin-btn admin-btn-secondary text-sm">
        Link contact
      </button>
    </form>
  );
}

export function InboxSyncButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className="admin-btn admin-btn-secondary text-sm"
      onClick={() => {
        start(async () => {
          const r = await runInboundSyncNowAction();
          if (r.ok) {
            alert(`Imported: ${r.result.imported}, verified replies: ${r.result.verifiedReplies}`);
          }
          router.refresh();
        });
      }}
    >
      {pending ? "Syncing…" : "Sync now"}
    </button>
  );
}
