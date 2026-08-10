"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  sendThreadReplyAction,
  saveThreadDraftAction,
  renderThreadReplyTemplateAction,
} from "@/lib/admin/crm-inbox-actions";

type SenderProfileOption = { id: string; name: string; fromEmail: string };

export function ThreadReplyComposer({
  threadId,
  initialBody = "",
  canSend,
  canChooseSender = false,
  templates = [],
  sendingProfiles = [],
  defaultSendingProfileId = null,
}: {
  threadId: string;
  initialBody?: string;
  canSend: boolean;
  canChooseSender?: boolean;
  templates?: Array<{ id: string; name: string }>;
  sendingProfiles?: SenderProfileOption[];
  defaultSendingProfileId?: string | null;
}) {
  const router = useRouter();
  const [body, setBody] = useState(initialBody);
  const [sendingProfileId, setSendingProfileId] = useState(defaultSendingProfileId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const clientRequestId = useState(() => crypto.randomUUID())[0];

  if (!canSend) {
    return <p className="text-sm text-neutral-500">You do not have permission to send CRM email.</p>;
  }

  return (
    <div className="space-y-2 border-t pt-4">
      <h3 className="text-sm font-semibold">Reply</h3>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {templates.length ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label htmlFor="reply-template">Insert template</label>
          <select
            id="reply-template"
            className="admin-input text-sm"
            defaultValue=""
            disabled={pending}
            onChange={(e) => {
              const templateId = e.target.value;
              if (!templateId) return;
              start(async () => {
                const res = await renderThreadReplyTemplateAction({ threadId, templateId });
                if (!res.ok) {
                  setError(res.error);
                  return;
                }
                if (res.hasUnresolved) {
                  setError("Template has unresolved variables — edit before sending.");
                } else {
                  setError(null);
                }
                setBody(res.body);
              });
              e.target.value = "";
            }}
          >
            <option value="">Choose…</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      ) : null}
      {canChooseSender && sendingProfiles.length ? (
        <label className="flex flex-wrap items-center gap-2 text-sm">
          From
          <select
            className="admin-input text-sm"
            value={sendingProfileId}
            disabled={pending}
            onChange={(e) => setSendingProfileId(e.target.value)}
          >
            <option value="">Routed default</option>
            {sendingProfiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.fromEmail})
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <textarea
        className="admin-input min-h-[120px] w-full text-sm"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write your reply…"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="admin-btn admin-btn-primary text-sm"
          disabled={pending || !body.trim()}
          onClick={() => {
            setError(null);
            start(async () => {
              const res = await sendThreadReplyAction({
                threadId,
                body,
                clientRequestId,
                sendingProfileId: sendingProfileId || null,
              });
              if (!res.ok) {
                setError(res.error);
                return;
              }
              setBody("");
              router.refresh();
            });
          }}
        >
          {pending ? "Sending…" : "Send reply"}
        </button>
        <button
          type="button"
          className="admin-btn admin-btn-secondary text-sm"
          disabled={pending}
          onClick={() => {
            start(async () => {
              await saveThreadDraftAction({ threadId, body });
              router.refresh();
            });
          }}
        >
          Save draft
        </button>
      </div>
    </div>
  );
}
