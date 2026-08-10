"use client";

import { useState, useTransition } from "react";
import { createContractTemplateVersionAction } from "@/lib/admin/contract-actions";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";

type Version = {
  id: string;
  versionNumber: number;
  name: string;
  content: string;
  createdAt: Date;
};

type Template = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  versions: Version[];
};

export function ContractTemplateDetailPanel({
  template,
  canManage,
}: {
  template: Template;
  canManage: boolean;
}) {
  const latest = template.versions[0];
  const [name, setName] = useState(latest?.name ?? template.name);
  const [content, setContent] = useState(latest?.content ?? "");
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {template.description ? (
        <p className="text-sm text-neutral-600">{template.description}</p>
      ) : null}

      <AdminPanel>
        <h2 className="font-semibold">Version history</h2>
        <ul className="mt-2 text-sm">
          {template.versions.map((v) => (
            <li key={v.id}>
              V{v.versionNumber} — {v.name} ({new Date(v.createdAt).toLocaleString()})
            </li>
          ))}
        </ul>
      </AdminPanel>

      {canManage ? (
        <AdminPanel className="space-y-3">
          <h2 className="font-semibold">New template version</h2>
          <p className="text-sm text-neutral-600">
            Substantive changes create a new version. Existing contracts keep their original template snapshot.
          </p>
          <input
            className="admin-input w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Version name"
          />
          <textarea
            className="admin-input min-h-64 w-full font-mono text-sm"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          {message ? <p className="text-sm">{message}</p> : null}
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            disabled={pending}
            onClick={() => {
              const fd = new FormData();
              fd.set("templateId", template.id);
              fd.set("name", name);
              fd.set("content", content);
              start(async () => {
                const r = await createContractTemplateVersionAction(fd);
                setMessage(r.ok ? "New version created." : r.error ?? "Failed.");
                if (r.ok) window.location.reload();
              });
            }}
          >
            Save as new version
          </button>
        </AdminPanel>
      ) : (
        <AdminPanel>
          <h2 className="font-semibold">Current content (V{latest?.versionNumber})</h2>
          <pre className="mt-2 whitespace-pre-wrap text-sm">{latest?.content}</pre>
        </AdminPanel>
      )}
    </div>
  );
}
