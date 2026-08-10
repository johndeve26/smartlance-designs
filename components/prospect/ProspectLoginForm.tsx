"use client";

import { useState } from "react";
import Link from "next/link";
import { requestMagicLinkAction } from "@/lib/prospect/actions";

export function ProspectLoginForm({ redirectMessage }: { redirectMessage?: string }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await requestMagicLinkAction(email);
      if (!result.ok) {
        setError(result.error ?? "Could not send login link.");
        return;
      }
      setSent(true);
    } catch {
      setError("Could not send login link.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-6 text-center">
        <p className="font-medium">Check your email</p>
        <p className="mt-2 text-sm text-neutral-600">
          If an account exists for that address, we sent a sign-in link.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {redirectMessage ? (
        <p className="rounded-md bg-[#F47A48]/10 px-3 py-2 text-sm text-[#535353]">
          {redirectMessage}
        </p>
      ) : null}
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-[#F47A48] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {loading ? "Sending…" : "Email me a sign-in link"}
      </button>
      <p className="text-center text-xs text-neutral-500">
        Same sign-in works for your workspace and Client Portal.
      </p>
      <p className="text-center text-sm">
        <Link href="/free-website-review" className="text-[#F47A48] hover:underline">
          Back to website review
        </Link>
      </p>
    </form>
  );
}
