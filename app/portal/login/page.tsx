"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { requestPortalLoginAction } from "@/lib/portal/actions";

export default function PortalLoginPage() {
  const [pending, start] = useTransition();
  const [sent, setSent] = useState(false);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Sign in to your portal</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Enter your email and we&apos;ll send you a secure sign-in link.
        </p>
      </div>

      {sent ? (
        <div className="rounded-lg border bg-white p-4 text-sm shadow-sm">
          <p>If your email has portal access, a sign-in link has been sent.</p>
          <p className="mt-2 text-neutral-600">Check your inbox and open the link to continue.</p>
        </div>
      ) : (
        <form
          className="space-y-4 rounded-lg border bg-white p-4 shadow-sm"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            start(async () => {
              const r = await requestPortalLoginAction(fd);
              if (!r.ok && "error" in r) alert(r.error);
              else setSent(true);
            });
          }}
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-10 w-full items-center justify-center rounded bg-neutral-900 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            {pending ? "Sending…" : "Send magic link"}
          </button>
        </form>
      )}

      <p className="text-center text-sm text-neutral-600">
        <Link href="/" className="hover:underline">
          Back to website
        </Link>
      </p>
    </div>
  );
}
