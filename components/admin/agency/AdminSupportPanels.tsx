"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminSupportReplyAction, adminLinkSupportChangeAction } from "@/lib/admin/client-success-actions";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";

export function AdminSupportReplyPanel({ supportRequestId }: { supportRequestId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <AdminPanel>
      <form
        className="space-y-3"
        action={(fd) => {
        fd.set("supportRequestId", supportRequestId);
        startTransition(async () => {
          await adminSupportReplyAction(fd);
          router.refresh();
        });
      }}
    >
      <h3 className="font-semibold">Reply to client</h3>
      <textarea name="body" required rows={4} className="admin-input w-full" placeholder="Message to client" />
      <div className="flex flex-wrap gap-2">
        <button type="submit" name="action" value="reply" disabled={pending} className="admin-btn">
          Send reply
        </button>
        <button type="submit" name="action" value="waiting" disabled={pending} className="admin-btn admin-btn-secondary">
          Send &amp; waiting on client
        </button>
        <button type="submit" name="action" value="resolve" disabled={pending} className="admin-btn admin-btn-secondary">
          Send &amp; resolve
        </button>
      </div>
      </form>
    </AdminPanel>
  );
}

export function AdminSupportLinkChangeForm({ supportRequestId }: { supportRequestId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <AdminPanel>
      <form
        className="space-y-3"
        action={(fd) => {
        fd.set("supportRequestId", supportRequestId);
        startTransition(async () => {
          await adminLinkSupportChangeAction(fd);
          router.refresh();
        });
      }}
    >
      <h3 className="font-semibold">Link change request</h3>
      <input name="changeRequestId" required placeholder="Change request ID" className="admin-input w-full" />
      <button type="submit" disabled={pending} className="admin-btn">
        Link
      </button>
      </form>
    </AdminPanel>
  );
}
