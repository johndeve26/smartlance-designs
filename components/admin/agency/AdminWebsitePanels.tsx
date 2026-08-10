"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  adminCreateCareEventAction,
  adminGrantWebsiteAccessAction,
  adminRevokeWebsiteAccessAction,
} from "@/lib/admin/client-success-actions";

export function AdminCareEventForm({ websiteId }: { websiteId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form
      className="space-y-3 border-t pt-4"
      action={(fd) => {
        fd.set("websiteId", websiteId);
        startTransition(async () => {
          await adminCreateCareEventAction(fd);
          router.refresh();
        });
      }}
    >
      <h3 className="font-semibold">Add care event</h3>
      <select name="type" className="admin-input">
        <option value="MAINTENANCE">Maintenance</option>
        <option value="UPDATE">Update</option>
        <option value="BACKUP">Backup</option>
        <option value="SECURITY">Security</option>
        <option value="OTHER">Other</option>
      </select>
      <input name="title" required placeholder="Title" className="admin-input w-full" />
      <textarea name="clientSummary" placeholder="Client-visible summary" className="admin-input w-full" rows={2} />
      <textarea name="internalNotes" placeholder="Internal notes (private)" className="admin-input w-full" rows={2} />
      <select name="status" defaultValue="COMPLETED" className="admin-input">
        <option value="COMPLETED">Completed</option>
        <option value="SCHEDULED">Scheduled</option>
        <option value="IN_PROGRESS">In progress</option>
      </select>
      <button type="submit" disabled={pending} className="admin-btn">
        Save care event
      </button>
    </form>
  );
}

export function AdminWebsiteAccessPanel({
  websiteId,
  access,
  contacts,
}: {
  websiteId: string;
  access: { contactId: string; name: string; email: string; role: string }[];
  contacts: { id: string; label: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="space-y-4">
      <ul className="text-sm">
        {access.map((a) => (
          <li key={a.contactId} className="flex items-center justify-between border-b py-2">
            <span>
              {a.name} ({a.email}) — {a.role}
            </span>
            <form
              action={(fd) => {
                fd.set("websiteId", websiteId);
                fd.set("contactId", a.contactId);
                startTransition(async () => {
                  await adminRevokeWebsiteAccessAction(fd);
                  router.refresh();
                });
              }}
            >
              <button type="submit" disabled={pending} className="text-xs text-red-600">
                Revoke
              </button>
            </form>
          </li>
        ))}
      </ul>
      <form
        className="flex flex-wrap gap-2"
        action={(fd) => {
          fd.set("websiteId", websiteId);
          startTransition(async () => {
            await adminGrantWebsiteAccessAction(fd);
            router.refresh();
          });
        }}
      >
        <select name="contactId" required className="admin-input">
          <option value="">Select contact</option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <select name="role" defaultValue="MEMBER" className="admin-input">
          <option value="VIEWER">Viewer</option>
          <option value="MEMBER">Member</option>
          <option value="WEBSITE_ADMIN">Website admin</option>
        </select>
        <button type="submit" disabled={pending} className="admin-btn">
          Grant access
        </button>
      </form>
    </div>
  );
}
