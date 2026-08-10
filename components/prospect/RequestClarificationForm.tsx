"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { respondClarificationAction } from "@/lib/prospect/actions";

export function RequestClarificationForm({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await respondClarificationAction(requestId, body);
      router.refresh();
      setBody("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <textarea
        required
        rows={4}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Your response…"
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-[#F47A48] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {loading ? "Sending…" : "Respond"}
      </button>
    </form>
  );
}
