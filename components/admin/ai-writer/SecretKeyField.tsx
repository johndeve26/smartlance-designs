"use client";

import { useId, useState } from "react";

export function SecretKeyField({
  configured,
  fingerprintLast4,
}: {
  configured: boolean;
  /** Last 4 only — never a secret */
  fingerprintLast4?: string | null;
}) {
  const id = useId();
  const [editing, setEditing] = useState(false);
  const [show, setShow] = useState(false);

  if (configured && !editing) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-neutral-800">API key</span>
          <button
            type="button"
            className="admin-btn-ghost text-xs"
            onClick={() => setEditing(true)}
          >
            Replace key
          </button>
        </div>
        <p className="rounded border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-sm text-neutral-600">
          ••••••••••••••••
          <span className="ml-2 text-xs text-neutral-500">
            Configured
            {fingerprintLast4 && fingerprintLast4 !== "env" ? ` · …${fingerprintLast4}` : ""}
          </span>
        </p>
      </div>
    );
  }

  if (!configured && !editing) {
    return (
      <div className="space-y-2">
        <span className="text-sm font-medium text-neutral-800">API key</span>
        <p className="text-sm text-neutral-600">No key configured</p>
        <button type="button" className="admin-btn" onClick={() => setEditing(true)}>
          Add API key
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-neutral-800">
        API key
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          name="apiKey"
          type={show ? "text" : "password"}
          autoComplete="off"
          className="admin-input font-mono"
          placeholder="Paste API key"
        />
        <button
          type="button"
          className="admin-btn shrink-0"
          onClick={() => setShow((v) => !v)}
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
      <button
        type="button"
        className="text-xs text-neutral-500 underline-offset-2 hover:underline"
        onClick={() => {
          setEditing(false);
          setShow(false);
        }}
      >
        Cancel
      </button>
    </div>
  );
}
