"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/lib/admin/auth-actions";

const initial: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <form action={action} className="admin-card mx-auto w-full max-w-sm space-y-4 shadow-sm">
      <div>
        <h1 className="admin-page-title">Sign in</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Smartlance Designs admin
        </p>
      </div>

      {state.error ? (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </div>
      ) : null}

      <label className="admin-field">
        <span className="admin-label">Email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="username"
          className="admin-input"
        />
      </label>

      <label className="admin-field">
        <span className="admin-label">Password</span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="admin-input"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="admin-btn-primary w-full"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
